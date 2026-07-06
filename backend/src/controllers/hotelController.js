const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const Hotel = require("../models/hotelModel");
const ActivityLog = require("../models/ActivityLog");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const PendingRegistration = require("../models/pendingRegistrationModel");

const { errorResponse, successResponse } = require("../utils/helpers");
const logger = require("../utils/logger.js");
const OTPService = require("../utils/otp");
const emailService = require("../services/emailServices");
const { validationResult } = require("express-validator");
const Redis = require("ioredis");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary.js");
const User = require("../models/UsersModel.js");
const PasswordResetToken = require('../models/passwordResetToken.js')
// ===================== CONSTANTS =====================
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY = "30d";
const OTP_EXPIRY = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Initialize Redis
let redis;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}

// ===================== HELPERS =====================
const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      out[k] = obj[k];
    }
  }
  return out;
};

function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function normalizeBool(value) {
  return value === true || value === "true";
}

function normalizePaymentMethod(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeBillingCycle(value = "") {
  return String(value).trim().toLowerCase();
}

function createEsewaSignature(message, secret) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

const sanitizeHotel = (hotel) => {
  if (!hotel) return null;

  const safeHotel = { ...hotel };
  const sensitiveFields = [
    "admin_password_hash",
    "verification_token",
    "password_reset_token",
    "password_reset_expires",
    "temp_reset_token",
    "temp_reset_expires",
    "login_attempts",
    "lock_until",
    "stripe_customer_id",
    "payment_methods",
  ];

  sensitiveFields.forEach((field) => delete safeHotel[field]);
  return safeHotel;
};

const generateTokens = (hotel, sessionId, rememberMe = false) => {
  const accessToken = jwt.sign(
    {
      session_id: sessionId,
      role: "hotel_admin",
      hotel_id: hotel.id,
      hotel_slug: hotel.hotel_slug,
      hotel_name: hotel.hotel_name,
      email: hotel.admin_email,
      subscription_status: hotel.subscription_status,
    },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "30d" : TOKEN_EXPIRY },
  );

  const refreshToken = rememberMe
    ? jwt.sign(
        {
          session_id: sessionId,
          hotel_id: hotel.id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY },
      )
    : null;

  return { accessToken, refreshToken };
};

const setTokenCookies = (res, tokens, rememberMe = false) => {
  const isProduction = process.env.NODE_ENV === "production";
  const accessMaxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie("hotel_token", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: accessMaxAge,
    path: "/",
  });

  if (tokens.refreshToken) {
    res.cookie("hotel_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });
  }
};

const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };

  res.clearCookie("hotel_token", cookieOptions);
  res.clearCookie("hotel_slug", { ...cookieOptions, httpOnly: false });
  res.clearCookie("hotel_session", { ...cookieOptions, httpOnly: false });
  res.clearCookie("hotel_refresh_token", {
    ...cookieOptions,
    path: "/api/auth/refresh",
  });
};

const logActivity = async (data) => {
  try {
    const logData = {
      ...data,
      details:
        typeof data.details === "object"
          ? JSON.stringify(data.details)
          : data.details,
    };

    delete logData.password;
    delete logData.token;

    await ActivityLog.logActivity(logData);
    logger.info("Activity logged:", {
      action: data.action,
      userId: data.user_id,
    });
  } catch (error) {
    logger.error("Activity log failed:", error);
  }
};

const handleFailedLogin = async (hotelId, email, req, sessionId, reason) => {
  try {
    await logActivity({
      session_id: sessionId,
      hotel_id: hotelId,
      user_id: hotelId,
      user_type: hotelId ? "hotel_admin" : "guest",
      action: "LOGIN_FAILED",
      details: {
        email,
        reason,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    logger.warn("Login failed", {
      sessionId,
      hotelId,
      email: email?.substring(0, 3) + "***",
      reason,
      ip: req.ip,
    });
  } catch (error) {
    logger.error("Failed to log failed login attempt:", error);
  }
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    };
  }
  return { valid: true };
};

const generateTempToken = (hotelId) => {
  return jwt.sign(
    {
      hotelId,
      purpose: "password_change",
      type: "temp",
    },
    process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET,
    { expiresIn: "5m" },
  );
};

const validateTempToken = (token, hotelId) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET,
    );
    return decoded.hotelId === hotelId && decoded.purpose === "password_change";
  } catch {
    return false;
  }
};

async function initiateKhaltiPayment({ amount, pending, plan, payload }) {
  const baseUrl =
    process.env.KHALTI_IS_LIVE === "true"
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2";

  const returnUrl = `${process.env.BACKEND_PUBLIC_URL}/api/hotel/registration/payment/khalti/callback`;
  const websiteUrl = process.env.API_BASE_URL;

  const purchaseOrderId = pending.id;
  const purchaseOrderName = plan.plan_name

  const response = await axios.post(
    `${baseUrl}/epayment/initiate/`,
    {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amount,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
    },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = response.data || {};
  console.log(data)



  await PendingRegistration.updatePartial(pending.id, {
    provider_reference: data.pidx,
    payment_provider: "khalti",
    payment_status: "pending",
  });


  return {
    provider: "khalti",
    payment_url: data.payment_url,
    reference: data.pidx || null,
    raw: data,
  };
}

async function initiateEsewaPayment({ amount, pending, plan, payload }) {
  const isLive = process.env.ESEWA_IS_LIVE === "true";

  const productCode = isLive
    ? process.env.ESEWA_PRODUCT_CODE
    : process.env.ESEWA_TEST_PRODUCT_CODE || "EPAYTEST";

  const secretKey = isLive
    ? process.env.ESEWA_SECRET_KEY
    : process.env.ESEWA_TEST_SECRET_KEY;

  const baseFormUrl = isLive
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  const transactionUuid = pending.id;
  const successUrl = `${process.env.BACKEND_PUBLIC_URL}/api/hotel/registration/payment/esewa/success`;
  const failureUrl = `${process.env.BACKEND_PUBLIC_URL}/api/hotel/registration/payment/esewa/failure`;

  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const message = `total_amount=${amount / 100},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = createEsewaSignature(message, secretKey);

  const formFields = {
    amount: amount / 100,
    tax_amount: 0,
    total_amount: amount / 100,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFieldNames,
    signature,
  };

  await PendingRegistration.updatePartial(pending.id, {
    provider_reference: transactionUuid,
    payment_provider: "esewa",
    payment_status: "pending",
  });

  return {
    provider: "esewa",
    payment_url: baseFormUrl,
    reference: transactionUuid,
    form_fields: formFields,
  };
}
exports.KhaltiCallBack = async (req, res) => {
  try {
    console.log("Khalti callback query:", req.query);

    const { pidx } = req.query;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Missing Khalti pidx",
      });
    }

    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY;

    if (!khaltiSecretKey) {
      return res.status(500).json({
        success: false,
        message: "Khalti secret key not configured",
      });
    }

    const verificationUrl = "https://a.khalti.com/api/v2/epayment/lookup/";

    const verifyResponse = await axios.post(
      verificationUrl,
      { pidx },
      {
        headers: {
          Authorization: `Key ${khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Khalti verification response:", verifyResponse.data);

    const verifyData = verifyResponse.data;

    const {
      status,
      transaction_id,
      total_amount,
      refunded,
    } = verifyData;

    // Find pending registration using pidx
    const pending = await PendingRegistration.findByProviderReference(pidx);

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending registration not found",
      });
    }

    // Already finalized protection
    const existingHotel = await Hotel.findByAdminEmail(pending.admin_email);
    if (existingHotel) {
      await PendingRegistration.delete(pending.id);

      return res.redirect(
        `${process.env.FRONTEND_PUBLIC_URL}/registration/success?hotel=${existingHotel.hotel_slug}`
      );
    }

    // -------------------
    // SUCCESSFUL PAYMENT
    // -------------------
    if (status === "Completed") {
      const plan = await SubscriptionPlan.findById(pending.subscription_plan_id);

      if (!plan) {
        await PendingRegistration.delete(pending.id);

        return res.status(400).json({
          success: false,
          message: "Subscription plan not found",
        });
      }

      // Optional amount check
      const expectedAmount = Number(pending.amount || 0);
      const paidAmount = Number(total_amount / 100 || 0);
  
      if (expectedAmount && paidAmount !== expectedAmount) {
        await PendingRegistration.delete(pending.id);

        return res.redirect(
          `${process.env.API_BASE_URL}/registration/failed?reason=amount_mismatch`
        );
      }

      const hotelPayload = {
        hotel_name: pending.hotel_name,
        hotel_slug: pending.hotel_slug,
        hotel_img: pending.hotel_img,

        admin_email: pending.admin_email,
        admin_password_hash: pending.admin_password_hash,
        admin_name: pending.admin_name,
        admin_phone: pending.admin_phone,

        hotel_phone: pending.hotel_phone,
        hotel_address: pending.hotel_address,
        city: pending.city,
        country: pending.country,
        timezone: pending.timezone,
        currency: pending.currency,
        tax_rate: pending.tax_rate,
        service_charge: pending.service_charge,

        subscription_plan_id: pending.subscription_plan_id,
        accept_marketing: pending.accept_marketing,
      };

      const planDetails = {
        ...plan,
        registration_type: pending.registration_type,
      };

      const createdHotel = await Hotel.createHotelWithSubscription({
        payload: hotelPayload,
        plan_details: planDetails,
      });

      await PendingRegistration.delete(pending.id);

      return res.redirect(
        `${process.env.API_BASE_URL}/registration/success?hotel=${createdHotel.hotel_slug}`
      );
    }
    await PendingRegistration.delete(pending.id);

    return res.redirect(
      `${process.env.FRONTEND_PUBLIC_URL}/registration/failed?reason=${encodeURIComponent(
        status || "payment_failed"
      )}`
    );
  } catch (error) {
    console.error("KhaltiCallBack error:", error);
    console.error("KhaltiCallBack stack:", error?.stack);
    console.error("Khalti verification error data:", error?.response?.data);

    return res.status(500).json({
      success: false,
      message: "Failed to finalize Khalti registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
exports.esewaSuccess = async (req, res) => {
  try {
    console.log("eSewa success query:", req.query);

    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Missing eSewa response data",
      });
    }

    // eSewa sends base64 encoded response
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

    console.log("Decoded eSewa success data:", decoded);

    const transactionUuid = decoded.transaction_uuid;
    const totalAmount = Number(decoded.total_amount);
    const status = decoded.status;
    const refId = decoded.ref_id || decoded.transaction_code || null;
    console.log(transactionUuid)
    if (!transactionUuid) {
      return res.status(400).json({
        success: false,
        message: "Missing transaction UUID",
      });
    }

    const pending = await PendingRegistration.findById
    (
      transactionUuid
    );

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending registration not found",
      });
    }

    console.log(pending)
    // Already finalized protection
    const existingHotel = await Hotel.findBySlug(pending.hotel_slug);
    if (existingHotel) {
      await PendingRegistration.delete(pending.id);

      return res.redirect(
        `${process.env.FRONTEND_PUBLIC_URL}/registration/success?hotel=${existingHotel.hotel_slug}`
      );
    }

    // Must be complete from callback
    if (status !== "COMPLETE") {
      await PendingRegistration.delete(pending.id);

      return res.redirect(
        `${process.env.FRONTEND_PUBLIC_URL}/registration/failed?reason=payment_not_complete`
      );
    }

    // Verify with eSewa status API
    const isLive = process.env.ESEWA_IS_LIVE === "true";

    const verificationUrl = isLive
      ? "https://esewa.com.np/api/epay/transaction/status/"
      : "https://rc.esewa.com.np/api/epay/transaction/status/";

    const productCode = isLive
      ? process.env.ESEWA_PRODUCT_CODE
      : process.env.ESEWA_TEST_PRODUCT_CODE || "EPAYTEST";

    const verifyResponse = await axios.get(verificationUrl, {
      params: {
        product_code: productCode,
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
      },
    });

    console.log("eSewa verification response:", verifyResponse.data);

    const verifyData = verifyResponse.data;

    if (!verifyData || verifyData.status !== "COMPLETE") {
      return res.redirect(
        `${process.env.FRONTEND_PUBLIC_URL}/registration/failed?reason=verification_failed`
      );
    }

    const plan = await SubscriptionPlan.findById(pending.subscription_plan_id);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    // Build payload for your existing createHotelWithSubscription method
    const hotelPayload = {
      hotel_name: pending.hotel_name,
      hotel_slug: pending.hotel_slug,
      hotel_img: pending.hotel_img,

      admin_email: pending.admin_email,
      admin_password_hash: pending.admin_password_hash,
      admin_name: pending.admin_name,
      admin_phone: pending.admin_phone,

      hotel_phone: pending.hotel_phone,
      hotel_address: pending.hotel_address,
      city: pending.city,
      country: pending.country,
      timezone: pending.timezone,
      currency: pending.currency,
      tax_rate: pending.tax_rate,
      service_charge: pending.service_charge,

      subscription_plan_id: pending.subscription_plan_id,
      accept_marketing: pending.accept_marketing,
    };

    const planDetails = {
      ...plan,
      registration_type: pending.registration_type,
    };

    // CREATE REAL HOTEL using your existing function
    const createdHotel = await Hotel.createHotelWithSubscription({
      payload: hotelPayload,
      plan_details: planDetails,
    });

    // delete pending after success
    await PendingRegistration.delete(pending.id);

    return res.redirect(
      `${process.env.FRONTEND_PUBLIC_URL}/registration/success?hotel=${createdHotel.hotel_slug}`
    );
  } catch (error) {
    console.error("esewaSuccess error:", error);
    console.error("esewaSuccess stack:", error?.stack);

    return res.status(500).json({
      success: false,
      message: "Failed to finalize registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
exports.esewaFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.query;

    if (transaction_uuid) {
      const pending = await PendingRegistration.findById(transaction_uuid);

      if (pending) {
        await PendingRegistration.delete(pending.id);
      }
    }

    return res.redirect(
      `${process.env.FRONTEND_PUBLIC_URL}/registration/failed`
    );
  } catch (error) {
    console.error("esewaFailure error:", error);
    return errorResponse(res, 500, "Payment failure handling failed");
  }
};
exports.startHotelRegistration = async (req, res) => {
  try {
    const hotelData = req.body.hotel || req.body;

    const required = [
      "hotel_name",
      "admin_email",
      "admin_password",
      "admin_name",
    ];

    const missingFields = required.filter((field) => !hotelData[field]);

    if (missingFields.length > 0) {
      return errorResponse(
        res,
        422,
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    const payload = pick(hotelData, [
      "hotel_name",
      "hotel_slug",
      "hotel_img",
      "admin_email",
      "admin_password",
      "admin_name",
      "admin_phone",
      "hotel_phone",
      "hotel_address",
      "city",
      "country",
      "timezone",
      "currency",
      "tax_rate",
      "service_charge",
      "subscription_plan_id",
      "registration_type",
      "accept_marketing",
      "billing_cycle",
      "payment_method",
    ]);

    payload.registration_type =
      payload.registration_type ||
      (payload.subscription_plan_id ? "subscription" : "trial");

    payload.accept_marketing = normalizeBool(payload.accept_marketing);
    payload.payment_method = normalizePaymentMethod(payload.payment_method);
    payload.billing_cycle = normalizeBillingCycle(payload.billing_cycle);

    payload.country = payload.country || "nepal";
    payload.timezone = payload.timezone || "NPT";
    payload.currency = payload.currency || "NPR";
    payload.tax_rate = Number(payload.tax_rate || 10);
    payload.service_charge = Number(payload.service_charge || 5);

    if (!payload.hotel_slug) {
      payload.hotel_slug = slugify(payload.hotel_name);
    }

    const allowedMethods = ["esewa", "khalti", "fonepay"];
    if (!allowedMethods.includes(payload.payment_method)) {
      return errorResponse(
        res,
        422,
        "Invalid payment_method. Allowed: esewa, khalti, fonepay",
      );
    }

    let plan = null;

    if (payload.subscription_plan_id) {
      plan = await SubscriptionPlan.findById(payload.subscription_plan_id);

      if (!plan || !plan.is_active) {
        return errorResponse(res, 400, "Invalid or inactive subscription plan");
      }
    } else {
      plan = await SubscriptionPlan.getDefaultPlan();

      if (!plan) {
        return errorResponse(res, 400, "No subscription plan available");
      }

      payload.subscription_plan_id = plan.id;
    }

    const hashedPassword = await bcrypt.hash(payload.admin_password, 10);



      let amount = 0;

      if (payload.registration_type === "subscription") {
        if (payload.billing_cycle === "monthly") {
          amount = Math.round(Number(plan.price_per_month) * 100);
        } else {
          amount = Math.round(Number(plan.price_per_year) * 100);
        }
      }

    if (!amount || Number.isNaN(amount) || amount < 1) {
      return errorResponse(res, 400, "Invalid payment amount");
    }
    if (payload.registration_type === "trial") {
      const existingHotel = await Hotel.findByAdminEmail(payload.admin_email);
      if (existingHotel) {
        return errorResponse(res, 409, "Admin email already exists");
      }

      const slugExists = await Hotel.checkSlugExists(payload.hotel_slug);
      if (slugExists) {
        return errorResponse(res, 409, "Hotel slug already exists");
      }

      const hashedPassword = await bcrypt.hash(payload.admin_password, 10);

      const today = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      const createdHotel = await Hotel.create({
        hotel_name: payload.hotel_name,
        hotel_slug: payload.hotel_slug,
        admin_email: payload.admin_email,
        admin_password_hash: hashedPassword,
        admin_name: payload.admin_name,
        admin_phone: payload.admin_phone || null,
        recovery_email: null,

        hotel_img: payload.hotel_img || null,
        hotel_phone: payload.hotel_phone || null,
        hotel_address: payload.hotel_address || null,
        city: payload.city || null,
        country: payload.country,
        timezone: payload.timezone,
        currency: payload.currency,
        tax_rate: payload.tax_rate,
        service_charge: payload.service_charge,

        subscription_plan_id: payload.subscription_plan_id || null,
        billing_cycle: "monthly",
        registration_type: "trial",
        payment_method: null,

        subscription_status: "trial",
        payment_status: "pending",

        subscription_start_date: null,
        subscription_end_date: null,
        trial_starts_at: today,
        trial_ends_at: trialEndsAt,

        max_staff_allowed: plan?.max_staff || 5,
        max_tables_allowed: plan?.max_tables || 20,
        max_menu_items_allowed: plan?.max_menu_items || 100,

        is_active: true,
        is_verified: true,
        accept_marketing: payload.accept_marketing,
      });

      return successResponse(res, 200, "Free trial started successfully", {
        registration_type: "trial",
        hotel_slug: createdHotel.hotel_slug,
        redirect_url: `${process.env.FRONTEND_PUBLIC_URL}/registration/success?hotel=${createdHotel.hotel_slug}`,
      });
    } else {
      const transactionUuid = uuidv4();

      const taxAmount = 0;
      const totalAmount = amount / 100;

      const pending = await PendingRegistration.create({
        hotel_name: payload.hotel_name,
        hotel_slug: payload.hotel_slug,
        hotel_phone: payload.hotel_phone || null,
        hotel_address: payload.hotel_address || null,
        city: payload.city || null,
        country: payload.country,
        timezone: payload.timezone,
        currency: payload.currency,
        hotel_img: payload.hotel_img || null,

        tax_rate: payload.tax_rate,
        service_charge: payload.service_charge,

        admin_name: payload.admin_name,
        admin_email: payload.admin_email,
        admin_phone: payload.admin_phone || null,
        admin_password_hash: hashedPassword,
        recovery_email: null,

        subscription_plan_id: payload.subscription_plan_id,
        billing_cycle: payload.billing_cycle || "monthly",
        registration_type: payload.registration_type,

        payment_method: payload.payment_method,
        payment_provider: payload.payment_method,
        amount: totalAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,

        transaction_uuid: transactionUuid,
        provider_reference: null,
        payment_status: "pending",

        accept_terms: true,
        accept_marketing: payload.accept_marketing,
        expires_at: null,
        paid_at: null,
        completed_at: null,
      });

      let paymentInit;

      switch (payload.payment_method) {
        case "esewa":
          paymentInit = await initiateEsewaPayment({
            amount,
            pending,
            plan,
            payload,
          });
          break;

        case "khalti":
          paymentInit = await initiateKhaltiPayment({
            amount,
            pending,
            plan,
            payload,
          });
          break;

        case "fonepay":
          paymentInit = await initiateFonepayPayment({
            amount,
            pending,
            plan,
            payload,
          });
          break;

        default:
          return errorResponse(res, 400, "Unsupported payment method");
      }

      return successResponse(res, 200, "Payment initiated successfully", {
        pending_registration_id: pending.id,
        payment_method: payload.payment_method,
        registration_type: payload.registration_type,
        billing_cycle: payload.billing_cycle || null,
        amount,
        amount_major: amount / 100,
        currency: payload.currency,
        provider: paymentInit.provider,
        payment_url: paymentInit.payment_url || null,
        payment_reference: paymentInit.reference || null,
        form_fields: paymentInit.form_fields || null,
        raw: paymentInit.raw || null,
      });
    }
  } catch (e) {
    console.error("startHotelRegistration error:", e?.response?.data || e);
    return errorResponse(
      res,
      500,
      "Failed to start registration: " +
        (e?.response?.data?.detail || e.message),
    );
  }
};

// ===================== LOGIN HOTEL ADMIN =====================
exports.loginHotel = async (req, res, next) => {
  const startTime = Date.now();
  const sessionId = uuidv4();

  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        {
          errors: parsed.error.flatten().fieldErrors,
        }
      );
    }

    const {
      email,
      password,
      slug,
      rememberMe = false,
    } = parsed.data;

    const cleanEmail = email.trim().toLowerCase();
    const cleanSlug = slug.trim().toLowerCase();

    logger.info("Login attempt started", {
      sessionId,
      email: cleanEmail.substring(0, 3) + "***",
      slug: cleanSlug,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // lockout by email + slug
    if (redis) {
      const lockoutKey = `lockout:${cleanSlug}:${cleanEmail}`;
      const lockout = await redis.get(lockoutKey);

      if (lockout) {
        const ttl = await redis.ttl(lockoutKey);

        await logActivity({
          session_id: sessionId,
          hotel_id: null,
          user_id: null,
          user_type: "guest",
          action: "LOGIN_BLOCKED_LOCKOUT",
          details: { email: cleanEmail, slug: cleanSlug, ip: req.ip },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
        });

        return errorResponse(
          res,
          429,
          `Account locked. Try again in ${ttl} seconds`,
          "ACCOUNT_LOCKED",
          { retryAfter: ttl }
        );
      }
    }

    // 1. check hotel by slug
    const hotel = await Hotel.getHotelBySlug(cleanSlug);

    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 100)
    );

    if (!hotel) {
      return errorResponse(
        res,
        404,
        "Hotel not found",
        "HOTEL_NOT_FOUND"
      );
    }

    // 2. hotel checks
    if (!hotel.is_active) {
      return errorResponse(
        res,
        403,
        "Account inactive. Please contact support.",
        "ACCOUNT_INACTIVE"
      );
    }

    if (
      hotel.subscription_status !== "active" &&
      hotel.subscription_status !== "trial"
    ) {
      return errorResponse(
        res,
        403,
        "Subscription not active",
        "SUBSCRIPTION_REQUIRED",
        {
          subscription_status: hotel.subscription_status,
        }
      );
    }

    if (
      hotel.registration_type === "trial" &&
      hotel.trial_ends_at &&
      new Date(hotel.trial_ends_at) < new Date()
    ) {
      return errorResponse(
        res,
        403,
        "Your trial has expired. Please upgrade to continue.",
        "TRIAL_EXPIRED"
      );
    }

    // 3. decide login source: admin or staff
    let authUser = null;
    let userType = null;
    let passwordHash = null;
    let redirectTo = `/hotel/${hotel.hotel_slug}/dashboard`;

    // admin login only if email matches hotel's admin email
    if (hotel.admin_email && hotel.admin_email.toLowerCase() === cleanEmail) {
      authUser = hotel;
      userType = "hotel_admin";
      passwordHash = hotel.admin_password_hash;
      redirectTo = `/hotel/${hotel.hotel_slug}/dashboard`;
    } else {
      // try staff login
      const staff = await HotelStaff.findByEmailAndHotelId(cleanEmail, hotel.id);

      if (staff) {
        // only active staff
        if (!staff.is_active) {
          return errorResponse(
            res,
            403,
            "Staff account is inactive",
            "STAFF_INACTIVE"
          );
        }

        // allow only these roles if you want restricted login
        const allowedRoles = [
          "manager",
          "cashier", // billing
          "chef",    // kitchen
          "cook",    // kitchen
          "waiter",
          "receptionist",
        ];

        if (!allowedRoles.includes(staff.role)) {
          return errorResponse(
            res,
            403,
            "This staff role is not allowed to login",
            "ROLE_NOT_ALLOWED"
          );
        }

        authUser = staff;
        userType = "staff";
        passwordHash = staff.password;

        if (staff.role === "cashier") {
          redirectTo = `/hotel/${hotel.hotel_slug}/dashboard?section=billing`;
        } else if (staff.role === "chef" || staff.role === "cook") {
          redirectTo = `/hotel/${hotel.hotel_slug}/dashboard?section=kitchen`;
        } else {
          redirectTo = `/hotel/${hotel.hotel_slug}/dashboard`;
        }
      }
    }

    if (!authUser || !passwordHash) {
      await handleFailedLogin(
        hotel.id,
        cleanEmail,
        req,
        sessionId,
        "EMAIL_NOT_FOUND"
      );

      return errorResponse(
        res,
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    // 4. verify password
    const passwordMatch = await bcrypt.compare(password, passwordHash);

    if (!passwordMatch) {
      await handleFailedLogin(
        hotel.id,
        cleanEmail,
        req,
        sessionId,
        "INVALID_PASSWORD"
      );

      if (redis) {
        const attemptsKey = `attempts:${cleanSlug}:${cleanEmail}`;
        const attempts = await redis.incr(attemptsKey);

        if (attempts === 1) {
          await redis.expire(attemptsKey, 15 * 60);
        }

        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutKey = `lockout:${cleanSlug}:${cleanEmail}`;
          await redis.setex(lockoutKey, LOCK_TIME / 1000, "locked");
        }

        return errorResponse(
          res,
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS",
          {
            remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts),
          }
        );
      }

      return errorResponse(
        res,
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    // clear attempts
    if (redis) {
      await redis.del(`attempts:${cleanSlug}:${cleanEmail}`);
      await redis.del(`lockout:${cleanSlug}:${cleanEmail}`);
    }

    // update last login
    if (userType === "hotel_admin") {
      await Hotel.updateLastLogin(hotel.id);
    } else {
      await HotelStaff.updateLastLogin(authUser.id);
    }

    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );

    // build token payload
    const tokenPayload = {
      id: authUser.id,
      hotel_id: hotel.id,
      hotel_slug: hotel.hotel_slug,
      email: userType === "hotel_admin" ? hotel.admin_email : authUser.email,
      role: userType === "hotel_admin" ? "hotel_admin" : authUser.role,
      user_type: userType,
      session_id: sessionId,
    };

    const tokens = generateTokens(tokenPayload, sessionId, rememberMe);

    setTokenCookies(res, tokens, rememberMe);

    res.cookie("hotel_slug", hotel.hotel_slug, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.cookie("hotel_session", sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      path: "/",
    });

    if (redis) {
      const sessionKey = `session:${sessionId}`;
      await redis.setex(
        sessionKey,
        (rememberMe ? 30 : 7) * 24 * 60 * 60,
        JSON.stringify({
          hotel_id: hotel.id,
          hotel_slug: hotel.hotel_slug,
          user_id: authUser.id,
          user_type: userType,
          role: userType === "hotel_admin" ? "hotel_admin" : authUser.role,
          email: userType === "hotel_admin" ? hotel.admin_email : authUser.email,
        })
      );
    }

    await logActivity({
      session_id: sessionId,
      hotel_id: hotel.id,
      user_id: authUser.id,
      user_type: userType,
      action: "LOGIN_SUCCESS",
      details: {
        email: cleanEmail,
        slug: cleanSlug,
        role: userType === "hotel_admin" ? "hotel_admin" : authUser.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        rememberMe,
        loginDuration: Date.now() - startTime,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return successResponse(res, 200, "Login successful", {
      user: {
        id: authUser.id,
        email: userType === "hotel_admin" ? hotel.admin_email : authUser.email,
        full_name: userType === "hotel_admin" ? hotel.admin_name : authUser.full_name,
        role: userType === "hotel_admin" ? "hotel_admin" : authUser.role,
        user_type: userType,
      },
      hotel_slug: hotel.hotel_slug,
      session: {
        id: sessionId,
        expires_at: expiresAt,
        is_remembered: rememberMe,
      },
      redirect_to: redirectTo,
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  } catch (error) {
    logger.error("Login error", {
      sessionId,
      email: req.body?.email ? req.body.email.substring(0, 3) + "***" : "unknown",
      slug: req.body?.slug || "unknown",
      error: error.message,
      stack: error.stack,
    });

    await logActivity({
      session_id: sessionId,
      hotel_id: null,
      user_id: null,
      user_type: "guest",
      action: "LOGIN_ERROR",
      details: {
        email: req.body?.email,
        slug: req.body?.slug,
        error: error.message,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return errorResponse(
      res,
      500,
      "Login failed. Please try again.",
      "SERVER_ERROR"
    );
  }
};
// ===================== LOGOUT HOTEL ADMIN =====================
exports.logoutHotelAdmin = async (req, res) => {
  try {
    const hotelId = req.hotel?.id;
    const sessionId = req.sessionId;

    // Remove session from Redis if available
    if (redis && sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    if (hotelId) {
      await logActivity({
        session_id: sessionId,
        hotel_id: hotelId,
        user_id: hotelId,
        user_type: "hotel_admin",
        action: "hotel_logout",
        details: {},
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
    }

    clearTokenCookies(res);

    return successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    logger.error("Logout error:", error);
    return errorResponse(res, 500, "Logout failed");
  }
};

// ===================== GET MY HOTEL =====================
exports.getMyHotel = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const hotel = await Hotel.getHotelWithPlan(hotelId);
    console.log(
      "------------------------------------------------------------------------------",
    );
    console.log("hotel:- ", hotel);

    if (!hotel) {
      return errorResponse(res, 404, "Hotel not found");
    }

    return successResponse(res, 200, "Hotel details retrieved", {
      hotel: sanitizeHotel(hotel),
    });
  } catch (e) {
    logger.error("Get my hotel error:", e);
    next(e);
  }
};

// ===================== UPDATE MY HOTEL =====================
exports.updateMyHotel = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const allowedFields = [
      "hotel_name",
      "hotel_slug",
      "admin_name",
      "admin_phone",
      "hotel_phone",
      "hotel_address",
      "city",
      "country",
      "timezone",
      "currency",
      "tax_rate",
      "service_charge",
    ];

    const patch = pick(req.body, allowedFields);

    if (Object.keys(patch).length === 0) {
      return errorResponse(res, 400, "No valid fields to update");
    }

    // Validate slug if being updated
    if (patch.hotel_slug && !SLUG_REGEX.test(patch.hotel_slug)) {
      return errorResponse(res, 400, "Invalid slug format");
    }

    const updated = await Hotel.updateMyHotel(hotelId, patch);

    if (!updated) {
      return errorResponse(res, 400, "No fields updated");
    }

    await logActivity({
      hotel_id: hotelId,
      user_id: hotelId,
      user_type: "hotel_admin",
      action: "hotel_profile_updated",
      details: {
        hotel_id: hotelId,
        changes: Object.keys(patch),
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    return successResponse(res, 200, "Hotel updated successfully", {
      hotel: sanitizeHotel(updated),
    });
  } catch (e) {
    if (e.code === "23505") {
      return errorResponse(
        res,
        409,
        "admin_email or hotel_slug already exists",
      );
    }
    logger.error("Update hotel error:", e);
    next(e);
  }
};

// ===================== CHANGE PASSWORD (WITH OLD PASSWORD) =====================
exports.changeMyPassword = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;
    const { old_password, new_password } = req.body;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 422, "Validation failed", errors.array());
    }

    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return errorResponse(res, 422, passwordValidation.message);
    }

    // Get hotel admin directly from users table
    const userResult = await db.query(
      `
      SELECT 
        id,
        hotel_id,
        full_name,
        email,
        password_hash
      FROM users
      WHERE hotel_id = $1
      LIMIT 1
      `,
      [hotelId]
    );

    if (userResult.rows.length === 0) {
      return errorResponse(res, 404, "Hotel admin user not found");
    }

    const user = userResult.rows[0];

    const isValidOldPassword = await bcrypt.compare(
      old_password,
      user.password_hash
    );

    if (!isValidOldPassword) {
      await logActivity({
        hotel_id: hotelId,
        user_id: user.id,
        user_type: "hotel_admin",
        action: "password_change_failed",
        details: { reason: "Incorrect old password" },
        ip_address: req.ip,
        user_agent: req.headers["user-agent"] || null,
      });

      return errorResponse(res, 401, "Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password directly in users table
    const updateResult = await db.query(
      `
      UPDATE users
      SET 
        password_hash = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id
      `,
      [hashedPassword, user.id]
    );

    if (updateResult.rows.length === 0) {
      return errorResponse(res, 500, "Failed to update password");
    }

    try {
      await emailService.sendPasswordChangeConfirmation({
        to: user.email,
        name: user.full_name,
      });
    } catch (emailError) {
      logger.error("Failed to send confirmation email", {
        hotelId,
        userId: user.id,
        error: emailError.message,
      });
    }

    await logActivity({
      hotel_id: hotelId,
      user_id: user.id,
      user_type: "hotel_admin",
      action: "hotel_admin_password_changed",
      details: { method: "direct" },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    return successResponse(res, 200, "Password updated successfully");
  } catch (e) {
    logger.error("Change password error:", e);
    next(e);
  }
};

exports.addOrUpdateRecoveryEmail = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;
    const { recovery_email } = req.body;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    if (!recovery_email || !recovery_email.trim()) {
      return errorResponse(res, 422, "Recovery email is required");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 422, "Validation failed", errors.array());
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(recovery_email)) {
      return errorResponse(res, 422, "Invalid email format");
    }

    // Check if recovery email is same as admin email
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 404, "Hotel not found");
    }

    if (hotel.admin_email === recovery_email) {
      return errorResponse(
        res,
        422,
        "Recovery email cannot be the same as admin email",
      );
    }

    // Check if recovery email is already used by another hotel
    const existingHotel = await Hotel.findByRecoveryEmail(recovery_email);
    if (existingHotel && existingHotel.id !== hotelId) {
      return errorResponse(
        res,
        409,
        "This recovery email is already associated with another account",
      );
    }

    // Update or add recovery email
    const isNew = !hotel.recovery_email;
    await Hotel.updateRecoveryEmail(hotelId, recovery_email);

    // Log activity
    await logActivity({
      hotel_id: hotelId,
      user_id: hotelId,
      user_type: "hotel_admin",
      action: isNew ? "recovery_email_added" : "recovery_email_updated",
      details: { recovery_email },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    try {
      if (isNew) {
        await emailService.sendRecoveryEmailAdded({
          to: recovery_email,
          name: hotel.admin_name,
          hotelName: hotel.hotel_name,
          adminEmail: hotel.admin_email,
        });
      } else {
        await emailService.sendRecoveryEmailUpdated({
          to: recovery_email,
          name: hotel.admin_name,
          hotelName: hotel.hotel_name,
          adminEmail: hotel.admin_email,
        });
      }
    } catch (emailError) {
      logger.error("Failed to send recovery email confirmation", {
        hotelId,
        error: emailError.message,
      });
      // Don't fail the request if email fails
    }

    return successResponse(
      res,
      200,
      isNew
        ? "Recovery email added successfully"
        : "Recovery email updated successfully",
      { recovery_email },
    );
  } catch (error) {
    logger.error("Add/Update recovery email error:", error);
    next(error);
  }
};

exports.getRecoveryEmail = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 404, "Hotel not found");
    }

    return successResponse(res, 200, "Recovery email retrieved", {
      recovery_email: hotel.recovery_email || null,
      has_recovery_email: !!hotel.recovery_email,
    });
  } catch (error) {
    logger.error("Get recovery email error:", error);
    next(error);
  }
};

exports.removeRecoveryEmail = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 404, "Hotel not found");
    }

    if (!hotel.recovery_email) {
      return errorResponse(res, 404, "No recovery email found");
    }

    await Hotel.removeRecoveryEmail(hotelId);

    // Log activity
    await logActivity({
      hotel_id: hotelId,
      user_id: hotelId,
      user_type: "hotel_admin",
      action: "recovery_email_removed",
      details: { removed_email: hotel.recovery_email },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    try {
      await emailService.sendRecoveryEmailRemoved({
        to: removedEmail,
        name: hotel.admin_name,
        hotelName: hotel.hotel_name,
        adminEmail: hotel.admin_email,
      });
    } catch (emailError) {
      logger.error("Failed to send recovery email removal confirmation", {
        hotelId,
        error: emailError.message,
      });
    }

    return successResponse(res, 200, "Recovery email removed successfully");
  } catch (error) {
    logger.error("Remove recovery email error:", error);
    next(error);
  }
};

// ===================== REQUEST PASSWORD CHANGE OTP =====================

exports.requestPasswordChangeOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 422, "Email is required");
    }

    const userEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return errorResponse(res, 404, "No account found with this email");
    }

    if (!user.is_active) {
      return errorResponse(res, 403, "Account is inactive. Please contact support.");
    }

    const targetEmail = user.recovery_email || user.email;
    const emailType = user.recovery_email ? "recovery" : "primary";

    const otp = OTPService.generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY);

    await PasswordResetToken.deleteOldTokens(user.id);

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashedOTP,
      expiresAt,
    });

    await emailService.sendOTPEmail({
      to: targetEmail,
      name: user.full_name,
      otp,
    });

    await logActivity({
      hotel_id: user.hotel_id,
      user_id: user.id,
      user_type: user.role,
      action: "password_reset_otp_requested",
      details: {
        emailSentTo: emailType,
        hasRecoveryEmail: !!user.recovery_email,
        expiresAt,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    return successResponse(res, 200, `OTP sent to your ${emailType} email`, {
      expiresIn: OTP_EXPIRY / 1000,
      emailType,
      hasRecoveryEmail: !!user.recovery_email,
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    next(error);
  }
};
// ===================== RESEND PASSWORD RESET OTP =====================
exports.resendPasswordChangeOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 422, "Email is required");
    }

    const userEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return errorResponse(res, 404, "No account found with this email");
    }

    if (!user.is_active) {
      return errorResponse(res, 403, "Account is inactive. Please contact support.");
    }

    const targetEmail = user.recovery_email || user.email;
    const emailType = user.recovery_email ? "recovery" : "primary";

    const otp = OTPService.generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY);

    await PasswordResetToken.deleteOldTokens(user.id);

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashedOTP,
      expiresAt,
    });

    await emailService.sendOTPEmail({
      to: targetEmail,
      name: user.full_name,
      otp,
    });

    await logActivity({
      hotel_id: user.hotel_id,
      user_id: user.id,
      user_type: user.role,
      action: "password_reset_otp_resent",
      details: {
        emailSentTo: emailType,
        hasRecoveryEmail: !!user.recovery_email,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    return successResponse(res, 200, `OTP resent to your ${emailType} email`, {
      expiresIn: OTP_EXPIRY / 1000,
      emailType,
      hasRecoveryEmail: !!user.recovery_email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    next(error);
  }
};
// ===================== VERIFY PASSWORD RESET OTP =====================
exports.verifyPasswordChangeOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 422, "Email is required");
    }

    if (!otp || !otp.trim()) {
      return errorResponse(res, 422, "OTP is required");
    }

    const userEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return errorResponse(res, 404, "No account found with this email");
    }

    const resetToken = await PasswordResetToken.findLatestValidTokenByUserId(user.id);

    if (!resetToken) {
      return errorResponse(res, 400, "OTP expired or not found. Please request a new OTP.");
    }

    const isValidOTP = await bcrypt.compare(otp, resetToken.token_hash);

    if (!isValidOTP) {
      await logActivity({
        hotel_id: user.hotel_id,
        user_id: user.id,
        user_type: user.role,
        action: "password_reset_otp_failed",
        details: { reason: "Invalid OTP" },
        ip_address: req.ip,
        user_agent: req.headers["user-agent"] || null,
      });

      return errorResponse(res, 400, "Invalid OTP. Please try again.");
    }

    const tempToken = generateTempToken(user.id);

    await PasswordResetToken.markAsUsed(resetToken.id);

    return successResponse(res, 200, "OTP verified successfully", {
      tempToken,
      expiresIn: 5 * 60,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    next(error);
  }
};
// ===================== CHANGE PASSWORD WITH OTP =====================
exports.changePasswordWithOTP = async (req, res, next) => {
  try {
    const { email, tempToken, new_password } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 422, "Email is required");
    }

    if (!tempToken) {
      return errorResponse(res, 422, "Verification token is required");
    }

    if (!new_password) {
      return errorResponse(res, 422, "New password is required");
    }

    const userEmail = email.trim().toLowerCase();
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return errorResponse(res, 404, "No account found with this email");
    }

    if (!validateTempToken(tempToken, user.id)) {
      return errorResponse(res, 401, "Invalid or expired verification token.");
    }

    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return errorResponse(res, 422, passwordValidation.message);
    }

    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);

    if (isSamePassword) {
      return errorResponse(res, 400, "New password cannot be same as old password");
    }

    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

    await User.updatePassword(user.id, hashedPassword);

    await PasswordResetToken.deleteOldTokens(user.id);

    await emailService.sendPasswordChangeConfirmation({
      to: user.email,
      name: user.full_name,
    });

    if (user.recovery_email) {
      await emailService.sendPasswordChangeConfirmation({
        to: user.recovery_email,
        name: user.full_name,
        isRecoveryEmail: true,
        adminEmail: user.email,
      });
    }

    await logActivity({
      hotel_id: user.hotel_id,
      user_id: user.id,
      user_type: user.role,
      action: "password_changed_with_otp",
      details: {
        method: "OTP_VERIFIED",
        hasRecoveryEmail: !!user.recovery_email,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    return successResponse(
      res,
      200,
      "Password updated successfully! Please login with your new password."
    );
  } catch (error) {
    console.error("Change password error:", error);
    next(error);
  }
};
// ===================== AUTH STATUS =====================
exports.getAuthStatus = async (req, res, next) => {
  try {
    // =========================
    // HOTEL SIDE USERS
    // roles from users table
    // =========================
    if (
      req.isAuthenticated &&
      req.user &&
      req.hotel &&
      [
        "hotel_admin",
        "kitchen",
        "billing",
        "waiter",
      ].includes(req.userRole)
    ) {
      let redirectTo = `/hotel/${req.hotel.hotel_slug}/dashboard`;
      
      

      return successResponse(res, 200, "Authenticated", {
        isAuthenticated: true,
        user: {
          id: req.user.id,
          hotel_id: req.user.hotel_id,
          role: req.user.role,
          email: req.user.email,
          full_name: req.user.full_name,
          phone_number: req.user.phone_number || null,
          staff_code: req.user.staff_code || null,
          profile_image: req.user.profile_image || null,
          is_active: req.user.is_active,
          is_email_verified: req.user.is_email_verified,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at,

          // hotel summary inside user for frontend convenience
          hotel_slug: req.hotel.hotel_slug,
          hotel_name: req.hotel.hotel_name,
        },
        hotel: sanitizeHotel(req.hotel),
        hotel_slug: req.hotel.hotel_slug,
        redirect_to: redirectTo,
        needs_refresh: false,
      });
    }

    // =========================
    // MAIN ADMIN
    // =========================
    if (req.isAuthenticated && req.userRole === "main_admin") {
      return successResponse(res, 200, "Authenticated", {
        isAuthenticated: true,
        user: {
          role: "main_admin",
        },
        hotel: null,
        hotel_slug: null,
        redirect_to: "/admin/dashboard",
        needs_refresh: false,
      });
    }

    // =========================
    // NOT AUTHENTICATED
    // =========================
    return successResponse(res, 200, "Not authenticated", {
      isAuthenticated: false,
      user: null,
      hotel: null,
      hotel_slug: null,
      redirect_to: null,
      needs_refresh: req.authStatusError === "TOKEN_EXPIRED",
    });
  } catch (error) {
    logger.error("Auth status error:", error);
    next(error);
  }
};

// ===================== CHECK SLUG EXISTS =====================
exports.checkSlugExists = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || !SLUG_REGEX.test(slug)) {
      return errorResponse(res, 400, "Invalid slug format");
    }

    const exists = await Hotel.checkSlugExists(slug);

    return successResponse(res, 200, "Slug check completed", {
      slug,
      available: !exists,
      exists,
    });
  } catch (error) {
    logger.error("Check slug error:", error);
    next(error);
  }
};

// ===================== GET SUBSCRIPTION STATUS =====================
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const hotelId = req.hotel?.id || req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    const status = await Hotel.getSubscriptionStatus(hotelId);

    if (!status) {
      return errorResponse(res, 404, "Subscription not found");
    }

    return successResponse(res, 200, "Subscription status retrieved", {
      status,
    });
  } catch (error) {
    logger.error("Get subscription status error:", error);
    next(error);
  }
};

module.exports = exports;
