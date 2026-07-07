const axios = require("axios");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const withTransaction = require("../utils/withTransaction");
const db = require("../config/database"); // only if needed elsewhere
const Hotel = require("../models/hotelModel");
const User = require("../models/UsersModel");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const PendingRegistration = require("../models/pendingRegistrationModel");
const ActivityLog = require("../models/ActivityLog");
const jwt = require("jsonwebtoken");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary.js");
const {
  loginSchema,
  registrationSchema,
} = require("../validators/hotelAuthValidation");
const { getPermissionsByRole } = require("../config/rolePermissions");
const Redis = require("ioredis");
const { errorResponse, successResponse } = require("../utils/helpers");
const crypto = require("crypto");
// Initialize Redis
let redis;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}
function normalizeBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}
function createEsewaSignature(message, secret) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}
function sanitizeHotel(hotel) {
  if (!hotel) return null;
  const { admin_password_hash, ...safeHotel } = hotel;
  return safeHotel;
}
const generateTokens = (hotel, sessionId, rememberMe = false) => {
  const accessToken = jwt.sign(
    {
      id: hotel.id,
      session_id: sessionId,
      hotel_id: hotel.hotel_id,
      role: hotel.role,
      hotel_slug: hotel.hotel_slug,
      email: hotel.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "30d" : process.env.TOKEN_EXPIRY },
  );

  const refreshToken = rememberMe
    ? jwt.sign(
        {
          session_id: sessionId,
          hotel_id: hotel.hotel_id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
      )
    : null;

  return { accessToken, refreshToken };
};
function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

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

function normalizePaymentMethod(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeBillingCycle(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return v === "yearly" ? "yearly" : "monthly";
}


async function createHotelFromRegistration({
  client,
  payload,
  plan,
  paymentStatus = "paid",
  subscriptionStatus = "active",
}) {
  const now = new Date();

  let subscriptionStartDate = null;
  let subscriptionEndDate = null;
  let trialStartsAt = null;
  let trialEndsAt = null;

  if (payload.registration_type === "trial") {
    trialStartsAt = now;
    trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  } else {
    subscriptionStartDate = now;
    subscriptionEndDate = new Date(now);

    if ((payload.billing_cycle || "monthly") === "yearly") {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }
  }

  return Hotel.createHotelWithSubscription(
    {
      hotel_name: payload.hotel_name,
      hotel_slug: payload.hotel_slug,
      hotel_img: payload.hotel_img || null,
      hotel_phone: payload.hotel_phone || null,
      hotel_address: payload.hotel_address || null,
      city: payload.city || null,
      country: payload.country || "Nepal",
      timezone: payload.timezone || "Asia/Kathmandu",
      currency: payload.currency || "NPR",
      tax_rate: Number(payload.tax_rate || 10),
      service_charge: Number(payload.service_charge || 5),

      subscription_plan_id: payload.subscription_plan_id || null,
      billing_cycle:
        payload.registration_type === "trial"
          ? "monthly"
          : payload.billing_cycle || "monthly",
      registration_type: payload.registration_type,
      subscription_status: subscriptionStatus,
      payment_status: paymentStatus,

      subscription_start_date: subscriptionStartDate,
      subscription_end_date: subscriptionEndDate,
      trial_starts_at: trialStartsAt,
      trial_ends_at: trialEndsAt,

      max_staff_allowed: plan?.max_staff || 5,
      max_tables_allowed: plan?.max_tables || 20,
      max_menu_items_allowed: plan?.max_menu_items || 100,

      is_active: true,
      is_verified: true,
      accept_marketing: !!payload.accept_marketing,
    },
    client,
  );
}
async function createHotelAndOwner({
  client,
  payload,
  plan,
  paymentStatus,
  subscriptionStatus,
  passwordHash,
}) {
  const hotel = await createHotelFromRegistration({
    client,
    payload,
    plan,
    paymentStatus,
    subscriptionStatus,
  });

  const owner = await createHotelOwnerUser({
    client,
    hotel,
    pendingOrPayload: payload,
    passwordHash,
  });

  return { hotel, owner };
}
async function createHotelOwnerUser({
  client,
  hotel,
  pendingOrPayload,
  passwordHash,
}) {
  if (!client) {
    throw new Error("Transaction client missing");
  }

  if (!hotel?.id) {
    console.log("Hotel row missing id:", hotel);
    throw new Error("Hotel id missing before creating owner user");
  }

  // Check if admin already exists for this hotel/email
  const existingUserResult = await client.query(
    `
    SELECT *
    FROM users
    WHERE hotel_id = $1
      AND LOWER(email) = LOWER($2)
    LIMIT 1
    `,
    [hotel.id, pendingOrPayload.admin_email],
  );

  if (existingUserResult.rows[0]) {
    return existingUserResult.rows[0];
  }

  const userResult = await client.query(
    `
    INSERT INTO users (
      hotel_id,
      full_name,
      email,
      phone_number,
      password_hash,
      role,
      is_active,
      is_email_verified,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, 'hotel_admin', true, true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING *
    `,
    [
      hotel.id,
      pendingOrPayload.admin_name,
      pendingOrPayload.admin_email,
      pendingOrPayload.admin_phone || null,
      passwordHash,
    ],
  );

  return userResult.rows[0];
}

async function finalizePendingRegistrationToHotel({
  pending,
  plan,
  paymentStatus = "paid",
}) {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const payload = {
      hotel_name: pending.hotel_name,
      hotel_slug: pending.hotel_slug,
      hotel_img: pending.hotel_img || null,
      hotel_phone: pending.hotel_phone || null,
      hotel_address: pending.hotel_address || null,
      city: pending.city || null,
      country: pending.country || "Nepal",
      timezone: pending.timezone || "Asia/Kathmandu",
      currency: pending.currency || "NPR",
      tax_rate: Number(pending.tax_rate || 10),
      service_charge: Number(pending.service_charge || 5),

      subscription_plan_id: pending.subscription_plan_id,
      billing_cycle: pending.billing_cycle || "monthly",
      registration_type: pending.registration_type || "subscription",
      payment_method: pending.payment_method || "khalti",
      accept_marketing: !!pending.accept_marketing,

      admin_name: pending.admin_name,
      admin_email: pending.admin_email,
      admin_phone: pending.admin_phone || null,
      recovery_email: pending.recovery_email || null,
    };

    // Check if hotel already exists because Khalti/eSewa callback can be hit again
    let hotelResult = await client.query(
      `
      SELECT *
      FROM hotels
      WHERE hotel_slug = $1
      LIMIT 1
      `,
      [payload.hotel_slug],
    );

    let hotel = hotelResult.rows[0];

    // Create hotel only if it does not already exist
    if (!hotel) {
      await createHotelFromRegistration({
        client,
        payload,
        plan,
        paymentStatus,
        subscriptionStatus: "active",
      });

      // Do not trust model return. Fetch the actual hotel row from DB.
      hotelResult = await client.query(
        `
        SELECT *
        FROM hotels
        WHERE hotel_slug = $1
        LIMIT 1
        `,
        [payload.hotel_slug],
      );

      hotel = hotelResult.rows[0];
    }

    if (!hotel) {
      throw new Error(`Hotel was not created/found for slug: ${payload.hotel_slug}`);
    }

    const owner = await createHotelOwnerUser({
      client,
      hotel,
      pendingOrPayload: payload,
      passwordHash: pending.admin_password_hash,
    });

    await client.query(
      `
      UPDATE pending_registrations
      SET
        payment_status = 'paid',
        paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
        completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
      WHERE id = $1
      `,
      [pending.id],
    );

    // Delete only after everything succeeds
    await client.query(
      `
      DELETE FROM pending_registrations
      WHERE id = $1
      `,
      [pending.id],
    );

    await client.query("COMMIT");

    return { hotel, owner };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("FINALIZE REGISTRATION ERROR:", error);
    throw error;
  } finally {
    client.release();
  }
}
async function initiateKhaltiPayment({ amount, pending, plan }) {
  const baseUrl =
    process.env.KHALTI_IS_LIVE === "true"
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2";

  const returnUrl = `https://api.cafesync.online/api/hotel/registration/payment/khalti/callback`;
  const websiteUrl = `https://api.cafesync.online`;

  const response = await axios.post(
    `${baseUrl}/epayment/initiate/`,
    {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount,
      purchase_order_id: pending.id,
      purchase_order_name: plan.plan_name,
    },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = response.data || {};
  console.log(data);

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

async function initiateEsewaPayment({ amount, pending }) {
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

exports.startHotelRegistration = async (req, res) => {
  try {
    const raw = req.body.hotel || req.body;

    const parsed = registrationSchema.safeParse({
      ...raw,
      accept_marketing: normalizeBool(raw.accept_marketing),
    });

    if (!parsed.success) {
      return errorResponse(res, 422, "Validation failed", "VALIDATION_ERROR", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;

    payload.hotel_slug = payload.hotel_slug || slugify(payload.hotel_name);
    payload.registration_type =
      payload.registration_type ||
      (payload.subscription_plan_id ? "subscription" : "trial");
    payload.billing_cycle = normalizeBillingCycle(payload.billing_cycle);
    payload.payment_method = normalizePaymentMethod(payload.payment_method);
    payload.country = payload.country || "Nepal";
    payload.timezone = payload.timezone || "Asia/Kathmandu";
    payload.currency = payload.currency || "NPR";
    payload.tax_rate = Number(payload.tax_rate || 10);
    payload.service_charge = Number(payload.service_charge || 5);

    const hotelSlugExists = await Hotel.findBySlug(payload.hotel_slug);
    const adminEmailExists = await User.findByEmail(payload.admin_email);
    if (hotelSlugExists) {
      return errorResponse(res, 409, "Hotel slug already exists");
    }
    if (adminEmailExists) {
      return errorResponse(res, 409, "Admin email already exists");
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

    const ownerPasswordHash = await bcrypt.hash(payload.admin_password, 10);

    if (payload.registration_type === "trial") {
      const result = await withTransaction(async (client) => {
        return createHotelAndOwner({
          client,
          payload,
          plan,
          paymentStatus: "pending",
          subscriptionStatus: "trial",
          passwordHash: ownerPasswordHash,
        });
      });

      return successResponse(res, 200, "Free trial started successfully", {
        registration_type: "trial",
        hotel_slug: result.hotel.hotel_slug,
        redirect_url: `${process.env.API_BASE_URL}/registration/success?hotel=${encodeURIComponent(result.hotel.hotel_slug)}`,
      });
    }

    const allowedMethods = ["esewa", "khalti"];
    if (!allowedMethods.includes(payload.payment_method)) {
      return errorResponse(
        res,
        422,
        "Invalid payment_method. Allowed: esewa, khalti, fonepay",
      );
    }

    let amount = 0;

    if ((payload.billing_cycle || "monthly") === "yearly") {
      amount = Math.round(Number(plan.price_per_year) * 100);
    } else {
      amount = Math.round(Number(plan.price_per_month) * 100);
    }

    if (!amount || Number.isNaN(amount) || amount < 1) {
      return errorResponse(res, 400, "Invalid payment amount");
    }

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
      admin_password_hash: ownerPasswordHash,
      recovery_email: payload.admin_email,

      subscription_plan_id: payload.subscription_plan_id,
      billing_cycle: payload.billing_cycle || "monthly",
      registration_type: "subscription",

      payment_method: payload.payment_method,
      payment_provider: payload.payment_method,
      amount: amount / 100,
      tax_amount: 0,
      total_amount: amount / 100,

      transaction_uuid: uuidv4(),
      provider_reference: null,
      payment_status: "pending",

      accept_terms: true,
      accept_marketing: payload.accept_marketing,
      expires_at: null,
      paid_at: null,
      completed_at: null,
    });

    let paymentInit = null;

    switch (payload.payment_method) {
      case "esewa":
        paymentInit = await initiateEsewaPayment({ amount, pending, plan });
        break;
      case "khalti":
        paymentInit = await initiateKhaltiPayment({ amount, pending, plan });
        break;

      default:
        return errorResponse(res, 400, "Unsupported payment method");
    }

    return successResponse(res, 200, "Payment initiated successfully", {
      pending_registration_id: pending.id,
      payment_method: payload.payment_method,
      registration_type: "subscription",
      payment_url: paymentInit.payment_url || null,
      form_fields: paymentInit.form_fields || null,
    });
  } catch (e) {
    console.log(e);
    return errorResponse(
      res,
      500,
      "Failed to start registration: " +
        (e?.response?.data?.detail || e.message),
    );
  }
};

exports.loginHotel = async (req, res) => {
  const startTime = Date.now();
  const sessionId = uuidv4();

  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, 400, "Validation failed", "VALIDATION_ERROR", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, slug, rememberMe = false } = parsed.data;

    const cleanEmail = email.trim().toLowerCase();
    const cleanSlug = slug.trim().toLowerCase();

    if (redis) {
      const lockoutKey = `lockout:${cleanSlug}:${cleanEmail}`;
      const lockout = await redis.get(lockoutKey);

      if (lockout) {
        const ttl = await redis.ttl(lockoutKey);

        return errorResponse(
          res,
          429,
          `Account locked. Try again in ${ttl} seconds`,
          "ACCOUNT_LOCKED",
          { retryAfter: ttl },
        );
      }
    }

    const hotel = await Hotel.findBySlug(cleanSlug);
    
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 100),
  );
  
  if (!hotel) {
    return errorResponse(res, 404, "Hotel not found", "HOTEL_NOT_FOUND");
  }
  
  if (!hotel.is_active) {
    return errorResponse(
      res,
      403,
      "Account inactive. Please contact support.",
      "ACCOUNT_INACTIVE",
    );
  }
  
  const hotel_details = await Hotel.getHotelWithPlan(hotel.id);
  if (
    hotel.subscription_status !== "active" &&
    hotel.subscription_status !== "trial"
  ) {
      return errorResponse(
        res,
        403,
        "Subscription not active",
        "SUBSCRIPTION_REQUIRED",
        { subscription_status: hotel.subscription_status },
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
        "TRIAL_EXPIRED",
      );
    }

    const user = await User.findByEmailAndHotelId(cleanEmail, hotel.id);

    if (!user) {
      return errorResponse(
        res,
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    if (!user.is_active) {
      return errorResponse(
        res,
        403,
        "User account is inactive",
        "ACCOUNT_INACTIVE",
      );
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return errorResponse(
        res,
        429,
        "Account is temporarily locked",
        "ACCOUNT_LOCKED",
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // await User.incrementFailedLogin(user.id);

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
          },
        );
      }

      return errorResponse(
        res,
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    if (redis) {
      await redis.del(`attempts:${cleanSlug}:${cleanEmail}`);
      await redis.del(`lockout:${cleanSlug}:${cleanEmail}`);
    }

    await User.updateLastLogin(user.id);

    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );

    let redirectTo = `/hotel/${hotel.hotel_slug}/dashboard`;

    if (user.role === "billing") {
      redirectTo = `/hotel/${hotel.hotel_slug}/billing/dashboard/`;
    } else if (user.role === "kitchen") {
      redirectTo = `/hotel/${hotel.hotel_slug}/kitchen/dashboard/`;
    }

    const tokenPayload = {
      id: user.id,
      hotel_id: hotel.id,
      hotel_slug: hotel.hotel_slug,
      email: user.email,
      role: user.role,
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
      await redis.setex(
        `session:${sessionId}`,
        (rememberMe ? 30 : 7) * 24 * 60 * 60,
        JSON.stringify({
          hotel_id: hotel.id,
          hotel_slug: hotel.hotel_slug,
          user_id: user.id,
          role: user.role,
          email: user.email,
        }),
      );
    }

return successResponse(res, 200, "Login successful", {
  user: {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  },

  hotel: hotel_details,

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
    console.log(error);

    return errorResponse(
      res,
      500,
      "Login failed. Please try again.",
      "SERVER_ERROR",
    );
  }
};
exports.KhaltiCallBack = async (req, res) => {
  try {
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

    const verifyResponse = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const verifyData = verifyResponse.data;
    const { status, total_amount, transaction_id } = verifyData;

    const pending = await PendingRegistration.findByProviderReference(pidx);

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending registration not found",
      });
    }

    if (status !== "Completed") {
      await PendingRegistration.delete(pending.id);
      return res.redirect(
        `https://cafesync.online/registration/failed?reason=${encodeURIComponent(
          status || "payment_failed",
        )}`,
      );
    }

    const plan = await SubscriptionPlan.findById(pending.subscription_plan_id);

    if (!plan) {
      await PendingRegistration.delete(pending.id);
      return res.redirect(
        `https://cafesync.online/registration/failed?reason=invalid_plan`,
      );
    }

    const expectedAmount = Number(pending.total_amount || pending.amount || 0);
    const paidAmount = Number(total_amount || 0) / 100;

    if (expectedAmount && paidAmount !== expectedAmount) {
      await PendingRegistration.delete(pending.id);
      return res.redirect(
        `https://cafesync.online/registration/failed?reason=amount_mismatch`,
      );
    }

    const { hotel } = await finalizePendingRegistrationToHotel({
      pending,
      plan,
      paymentStatus: "paid",
    });

    return res.redirect(
      `https://cafesync.online/registration/success?hotel=${encodeURIComponent(
        hotel.hotel_slug,
      )}`,
    );
  } catch (error) {
    console.error("KhaltiCallBack error:", error);
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

    if (!transactionUuid) {
      return res.status(400).json({
        success: false,
        message: "Missing transaction UUID",
      });
    }
    console.log(transactionUuid);
    const pending = await PendingRegistration.findById(transactionUuid);
    console.log(pending);

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending registration not found",
      });
    }

    // Must be complete from callback
    if (status !== "COMPLETE") {
      await PendingRegistration.delete(pending.id);

      return res.redirect(
        `https://cafesync.online/registration/failed?reason=payment_not_complete`,
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
        `https://cafesync.online/registration/failed?reason=verification_failed`,
      );
    }

    const plan = await SubscriptionPlan.findById(pending.subscription_plan_id);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    const { hotel } = await finalizePendingRegistrationToHotel({
      pending,
      plan,
      paymentStatus: "paid",
    });

    return res.redirect(
      `https://cafesync.online/registration/success?hotel=${encodeURIComponent(
        hotel.hotel_slug,
      )}`,
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
      `https://cafesync.online/registration/failed`,
    );
  } catch (error) {
    console.error("esewaFailure error:", error);
    return errorResponse(res, 500, "Payment failure handling failed");
  }
};
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
        "staff",
        "kitchenstaff",
        "billing",
        "cashier",
        "waiter",
        "manager",
      ].includes(req.userRole)
    ) {
      let redirectTo = null;

      // switch (req.userRole) {
      //   case "hotel_admin":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/dashboard`;
      //     break;

      //   case "kitchenstaff":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/kitchen/dashboard`;
      //     break;

      //   case "billing":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/billing/dashboard`;
      //     break;

      //   case "cashier":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/cashier/dashboard`;
      //     break;

      //   case "waiter":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/waiter/dashboard`;
      //     break;

      //   case "manager":
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/manager/dashboard`;
      //     break;

      //   case "staff":
      //   default:
      //     redirectTo = `/hotel/${req.hotel.hotel_slug}/staff/dashboard`;
      //     break;

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
        redirect_to: `/hotel/${req.hotel.hotel_slug}/dashboard`,
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
exports.updateProfile = async (req, res, next) => {
  try {
    console.log('BODY:', req.body)
    console.log('FILE:', req.file)
    console.log('JWT USER ID:', req.id)

    const payload = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      profile_image: req.body.profile_image,
      updated_by: req.id,
    }


    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/staff/`,
      });
      payload.profile_image = uploadedImage.secure_url;
    }

    const user = await User.updateById(req.id, payload)

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    })
  } catch (err) {
    next(err)
  }
};
// ===============================
// SUBSCRIPTION UPGRADE / DOWNGRADE
// ===============================

function subNormalizePaymentMethod(value) {
  return String(value || "").trim().toLowerCase();
}

function subNormalizeBillingCycle(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "yearly" ? "yearly" : "monthly";
}

function subToMoney(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function subDateOnly(date) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 10);
}

function subAddBillingCycle(baseDate, billingCycle) {
  const d = new Date(baseDate);
  const originalDay = d.getDate();

  if (billingCycle === "yearly") {
    d.setDate(1);
    d.setFullYear(d.getFullYear() + 1);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, maxDay));
    return d;
  }

  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, maxDay));
  return d;
}

function subDaysRemaining(endDate) {
  if (!endDate) return 0;

  const now = new Date();
  const end = new Date(endDate);

  if (Number.isNaN(end.getTime()) || end <= now) return 0;

  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function subGenerateInvoiceNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replaceAll("-", "");
  return `SUB-${ymd}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function subGetHotelId(req) {
  return (
    req.hotel?.id ||
    req.user?.hotel_id ||
    req.user?.hotelId ||
    req.hotel_id ||
    req.hotelId ||
    null
  );
}

function subGetPlanRank(plan) {
  return (
    subToMoney(plan?.price_per_month) ||
    subToMoney(plan?.price_per_year) ||
    Number(plan?.max_staff || 0) * 100000 +
      Number(plan?.max_tables || 0) * 1000 +
      Number(plan?.max_menu_items || 0)
  );
}

function subGetAmountByCycle(plan, billingCycle) {
  return billingCycle === "yearly"
    ? subToMoney(plan.price_per_year)
    : subToMoney(plan.price_per_month);
}

function cleanEsewaAmount(value) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid eSewa amount: ${value}`);
  }

  // eSewa accepts plain decimal string. Do not use comma.
  return n.toFixed(2);
}

async function subInitiateEsewaSubscriptionPayment({
  invoice,
  amount,
  total_amount,
}) {
  const rawAmount = amount ?? total_amount ?? invoice?.total_amount;
  const finalAmount = cleanEsewaAmount(rawAmount);

  const isLive = process.env.ESEWA_IS_LIVE === "true";

  const productCode = isLive
    ? process.env.ESEWA_PRODUCT_CODE
    : process.env.ESEWA_TEST_PRODUCT_CODE || "EPAYTEST";

  const secretKey = isLive
    ? process.env.ESEWA_SECRET_KEY
    : process.env.ESEWA_TEST_SECRET_KEY;

  if (!secretKey) {
    throw new Error("eSewa secret key is not configured");
  }

  const baseFormUrl = isLive
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  const transactionUuid = String(invoice.transaction_id);

  const successUrl = `https://api.cafesync.online/api/hotel/subscription/payment/esewa/success`;
  const failureUrl = `https://api.cafesync.online/api/hotel/subscription/payment/esewa/failure`;

  const signedFieldNames = "total_amount,transaction_uuid,product_code";

  // IMPORTANT: message value must exactly match form field values
  const message = `total_amount=${finalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = createEsewaSignature(message, secretKey);

  return {
    provider: "esewa",
    payment_url: baseFormUrl,
    reference: transactionUuid,
    form_fields: {
      amount: finalAmount,
      tax_amount: "0",
      total_amount: finalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: signedFieldNames,
      signature,
    },
  };
}
async function subInitiateKhaltiSubscriptionPayment({ invoice, amount, plan }) {
  const baseUrl =
    process.env.KHALTI_IS_LIVE === "true"
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2";

  const returnUrl = `https://api.cafesync.online/api/hotel/subscription/payment/khalti/callback`;
  const websiteUrl = `https://api.cafesync.online`;
  console.log(amount)
  const response = await axios.post(
    `${baseUrl}/epayment/initiate/`,
    {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: Math.round(Number(amount) * 100),
      purchase_order_id: invoice.id,
      purchase_order_name: plan.plan_name,
    },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = response.data || {};

  await db.query(
    `
    UPDATE subscription_invoices
    SET transaction_id = $1
    WHERE id = $2
    `,
    [data.pidx, invoice.id],
  );

  return {
    provider: "khalti",
    payment_url: data.payment_url,
    reference: data.pidx,
  };
}

async function subFinalizePaidSubscriptionInvoice({
  invoiceId,
  transactionId = null,
  paymentMethod = null,
}) {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `
      SELECT *
      FROM subscription_invoices
      WHERE id = $1
      FOR UPDATE
      `,
      [invoiceId],
    );

    const invoice = invoiceResult.rows[0];

    if (!invoice) {
      throw new Error("Subscription invoice not found");
    }

    if (invoice.status === "paid") {
      await client.query("COMMIT");
      return invoice;
    }

    const planResult = await client.query(
      `
      SELECT *
      FROM subscription_plans
      WHERE id = $1
      `,
      [invoice.subscription_plan_id],
    );

    const plan = planResult.rows[0];

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    await client.query(
      `
      UPDATE hotels
      SET
        subscription_plan_id = $1,
        billing_cycle = $2,
        registration_type = 'subscription',
        subscription_status = 'active',
        payment_status = 'paid',
        subscription_start_date = COALESCE(subscription_start_date, $3::date),
        subscription_end_date = $4::date,
        trial_ends_at = NULL,
        max_staff_allowed = $5,
        max_tables_allowed = $6,
        max_menu_items_allowed = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      `,
      [
        invoice.subscription_plan_id,
        invoice.billing_cycle,
        invoice.billing_period_start,
        invoice.billing_period_end,
        plan.max_staff,
        plan.max_tables,
        plan.max_menu_items,
        invoice.hotel_id,
      ],
    );

    const paidInvoiceResult = await client.query(
      `
      UPDATE subscription_invoices
      SET
        status = 'paid',
        paid_at = CURRENT_TIMESTAMP,
        payment_method = COALESCE($1, payment_method),
        transaction_id = COALESCE($2, transaction_id)
      WHERE id = $3
      RETURNING *
      `,
      [paymentMethod, transactionId, invoice.id],
    );

    await client.query("COMMIT");

    return paidInvoiceResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

exports.upgradeDowngradeBilling = async (req, res, next) => {
  const client = await db.getClient();

  try {
    const raw = req.body || {};

    const hotelId = subGetHotelId(req);
    const planId = raw.plan_id || raw.subscription_plan_id;
    const billingCycle = subNormalizeBillingCycle(raw.billing_cycle);
    const paymentMethod = subNormalizePaymentMethod(raw.payment_method);

    if (!hotelId) {
      return errorResponse(res, 401, "Hotel authentication required");
    }

    if (!planId) {
      return errorResponse(res, 422, "plan_id is required");
    }

    if (!["esewa", "khalti"].includes(paymentMethod)) {
      return errorResponse(
        res,
        422,
        "Invalid payment_method. Allowed: esewa, khalti",
      );
    }

    await client.query("BEGIN");

    const hotelResult = await client.query(
      `
      SELECT
        h.*,
        cp.plan_name AS current_plan_name,
        cp.plan_code AS current_plan_code,
        cp.price_per_month AS current_price_per_month,
        cp.price_per_year AS current_price_per_year,
        cp.max_staff AS current_max_staff,
        cp.max_tables AS current_max_tables,
        cp.max_menu_items AS current_max_menu_items
      FROM hotels h
      LEFT JOIN subscription_plans cp ON cp.id = h.subscription_plan_id
      WHERE h.id = $1
      FOR UPDATE OF h
      `,
      [hotelId],
    );

    const hotel = hotelResult.rows[0];

    if (!hotel) {
      await client.query("ROLLBACK");
      return errorResponse(res, 404, "Hotel not found");
    }

    const planResult = await client.query(
      `
      SELECT *
      FROM subscription_plans
      WHERE id = $1 AND is_active = true
      `,
      [planId],
    );

    const newPlan = planResult.rows[0];

    if (!newPlan) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Invalid or inactive subscription plan");
    }

    const currentPlan = {
      id: hotel.subscription_plan_id,
      plan_name: hotel.current_plan_name,
      plan_code: hotel.current_plan_code,
      price_per_month: hotel.current_price_per_month,
      price_per_year: hotel.current_price_per_year,
      max_staff: hotel.current_max_staff,
      max_tables: hotel.current_max_tables,
      max_menu_items: hotel.current_max_menu_items,
    };

    const currentRank = subGetPlanRank(currentPlan);
    const newRank = subGetPlanRank(newPlan);

    let changeType = "renew";

    if (!hotel.subscription_plan_id) {
      changeType = "new_subscription";
    } else if (String(newPlan.id) === String(hotel.subscription_plan_id)) {
      changeType =
        billingCycle === hotel.billing_cycle ? "renew" : "billing_cycle_change";
    } else if (newRank > currentRank) {
      changeType = "upgrade";
    } else if (newRank < currentRank) {
      changeType = "downgrade";
    } else {
      changeType = "plan_change";
    }

    const now = new Date();

    const validSubscriptionEnd =
      hotel.subscription_end_date && new Date(hotel.subscription_end_date) > now
        ? new Date(hotel.subscription_end_date)
        : null;

    const validTrialEnd =
      hotel.trial_ends_at && new Date(hotel.trial_ends_at) > now
        ? new Date(hotel.trial_ends_at)
        : null;

    const activeEndDate = validSubscriptionEnd || validTrialEnd;
    const daysRemaining = subDaysRemaining(activeEndDate);

    if (changeType === "downgrade" && daysRemaining > 7) {
      await client.query("ROLLBACK");

      return errorResponse(
        res,
        403,
        `Downgrade is allowed only when 7 days or less are remaining. You still have ${daysRemaining} days left.`,
        "DOWNGRADE_NOT_ALLOWED",
        {
          days_remaining: daysRemaining,
          allowed_after_days: daysRemaining - 7,
        },
      );
    }

    const amount = subGetAmountByCycle(newPlan, billingCycle);

    if (!amount || amount < 1) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Invalid subscription amount");
    }

    // IMPORTANT:
    // If current subscription/trial still has remaining days,
    // new monthly/yearly time is added after that remaining period.
    const billingPeriodStart = activeEndDate && activeEndDate > now ? activeEndDate : now;
    const billingPeriodEnd = subAddBillingCycle(billingPeriodStart, billingCycle);

    const invoiceNumber = subGenerateInvoiceNumber();
    const transactionUuid = uuidv4();
    const tax_amount = amount * 0.13;
const total_amount = amount + tax_amount;



const invoiceResult = await client.query(
  `
  INSERT INTO subscription_invoices (
    hotel_id,
    subscription_plan_id,
    invoice_number,
    billing_cycle,
    amount,
    tax_amount,
    total_amount,
    billing_period_start,
    billing_period_end,
    due_date,
    status,
    payment_method,
    transaction_id
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8::date, $9::date, $10::date,
    'pending', $11, $12
  )
  RETURNING *
  `,
  [
    hotel.id,
    newPlan.id,
    invoiceNumber,
    billingCycle,
    amount,
    tax_amount,
    total_amount,
    subDateOnly(billingPeriodStart),
    subDateOnly(billingPeriodEnd),
    subDateOnly(now),
    paymentMethod,
    transactionUuid,
  ]
);
    console.log(total_amount)
    const invoice = invoiceResult.rows[0];

    await client.query("COMMIT");

    let paymentInit;

    if (paymentMethod === "esewa") {
      paymentInit = await subInitiateEsewaSubscriptionPayment({
        invoice,
        amount:total_amount,
      });
    } else if (paymentMethod === "khalti") {
      console.log(total_amount)
      paymentInit = await subInitiateKhaltiSubscriptionPayment({
        invoice,
        amount:total_amount,
        plan: newPlan,
      });
    }

return successResponse(res, 200, "Subscription payment initiated", {
  change_type: changeType,
  days_remaining: daysRemaining,
  current_plan_id: hotel.subscription_plan_id,
  selected_plan_id: newPlan.id,
  billing_cycle: billingCycle,
  payment_method: paymentMethod,
  amount,
  tax_amount,
  total_amount,
  billing_period_start: subDateOnly(billingPeriodStart),
  billing_period_end: subDateOnly(billingPeriodEnd),
  invoice,
  payment_url: paymentInit?.payment_url || null,
  form_fields: paymentInit?.form_fields || null,
});
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("upgradeDowngradeBilling error:", error);

    return errorResponse(
      res,
      500,
      "Failed to start subscription payment: " + error.message,
    );
  } finally {
    client.release();
  }
};

// ===============================
// SUBSCRIPTION INVOICES LIST
// ===============================

exports.getHotelSubscriptionInvoices = async (req, res, next) => {
  try {
    const hotelId = subGetHotelId(req);

    if (!hotelId) {
      return errorResponse(res, 401, "Hotel authentication required");
    }

    const result = await db.query(
      `
      SELECT
        si.*,
        sp.plan_name
      FROM subscription_invoices si
      LEFT JOIN subscription_plans sp ON sp.id = si.subscription_plan_id
      WHERE si.hotel_id = $1
      ORDER BY si.created_at DESC
      `,
      [hotelId],
    );

    return successResponse(res, 200, "Invoices fetched successfully", {
      invoices: result.rows,
    });
  } catch (error) {
    console.error("getHotelSubscriptionInvoices error:", error);
    return errorResponse(res, 500, "Failed to fetch invoices");
  }
};
exports.getSingleSubscriptionInvoice = async (req, res, next) => {
  try {
    const hotelId =
      req.hotel?.id ||
      req.hotelId ||
      req.user?.hotel_id ||
      req.user?.hotelId ||
      req.hotel_id ||
      null;

    const invoiceId =
      req.params.invoiceId ||
      req.query.invoice_id ||
      req.query.invoiceId;

    if (!hotelId) {
      return errorResponse(res, 401, "Authentication required");
    }

    if (!invoiceId) {
      return errorResponse(res, 422, "Invoice id is required");
    }

    const result = await db.query(
      `
      SELECT
      *
      FROM subscription_invoices si

      LEFT JOIN subscription_plans sp
        ON sp.id = si.subscription_plan_id

      LEFT JOIN hotels h
        ON h.id = si.hotel_id

      LEFT JOIN LATERAL (
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.phone_number
        FROM users u
        WHERE u.hotel_id = h.id
          AND u.role = 'hotel_admin'
          AND u.is_active = true
    
        LIMIT 1
      ) admin_user ON true

      WHERE si.id = $1
        AND si.hotel_id = $2
      LIMIT 1
      `,
      [invoiceId, hotelId]
    );

    const invoice = result.rows[0];

    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found");
    }

    return successResponse(res, 200, "Invoice fetched successfully", {
      invoice,
    });
  } catch (error) {
    console.error("getSingleSubscriptionInvoice error:", error);
    return errorResponse(res, 500, "Failed to fetch invoice");
  }
};
// ===============================
// KHALTI SUBSCRIPTION CALLBACK
// ===============================

exports.subscriptionKhaltiCallback = async (req, res) => {
  try {
    const { pidx } = req.query;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Missing Khalti pidx",
      });
    }

    const verifyResponse = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const verifyData = verifyResponse.data || {};
    const { status, total_amount, transaction_id } = verifyData;

    const invoiceResult = await db.query(
      `
      SELECT *
      FROM subscription_invoices
      WHERE transaction_id = $1
      LIMIT 1
      `,
      [pidx],
    );

    const invoice = invoiceResult.rows[0];

    if (!invoice) {
      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=invoice_not_found`,
      );
    }

    if (status !== "Completed") {
      await db.query(
        `
        UPDATE subscription_invoices
        SET status = 'cancelled'
        WHERE id = $1
        `,
        [invoice.id],
      );

      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=${encodeURIComponent(
          status || "payment_failed",
        )}`,
      );
    }
    // console.log(paidAmount)
    // console.log(expectedAmount)
    const expectedAmount = Number(invoice.total_amount || 0);
    const paidAmount = Number(total_amount || 0) / 100;

    if (expectedAmount && paidAmount !== expectedAmount) {
      await db.query(
        `
        UPDATE subscription_invoices
        SET status = 'cancelled'
        WHERE id = $1
        `,
        [invoice.id],
      );

      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=amount_mismatch`,
      );
    }

    const paidInvoice = await subFinalizePaidSubscriptionInvoice({
      invoiceId: invoice.id,
      transactionId: transaction_id || pidx,
      paymentMethod: "khalti",
    });

    return res.redirect(
      `https://cafesync.online//subscription/success?invoice=${encodeURIComponent(
        paidInvoice.invoice_number,
      )}`,
    );
  } catch (error) {
    console.error("subscriptionKhaltiCallback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to finalize Khalti subscription payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ===============================
// ESEWA SUBSCRIPTION SUCCESS
// ===============================

exports.subscriptionEsewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Missing eSewa response data",
      });
    }

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

    const transactionUuid = decoded.transaction_uuid;
    const totalAmount = Number(decoded.total_amount);
    const status = decoded.status;
    const refId = decoded.ref_id || decoded.transaction_code || null;

    if (!transactionUuid) {
      return res.status(400).json({
        success: false,
        message: "Missing transaction UUID",
      });
    }

    const invoiceResult = await db.query(
      `
      SELECT *
      FROM subscription_invoices
      WHERE transaction_id = $1
      LIMIT 1
      `,
      [transactionUuid],
    );

    const invoice = invoiceResult.rows[0];

    if (!invoice) {
      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=invoice_not_found`,
      );
    }

    if (status !== "COMPLETE") {
      await db.query(
        `
        UPDATE subscription_invoices
        SET status = 'cancelled'
        WHERE id = $1
        `,
        [invoice.id],
      );

      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=payment_not_complete`,
      );
    }

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

    const verifyData = verifyResponse.data || {};

    if (verifyData.status !== "COMPLETE") {
      return res.redirect(
        `https://cafesync.online/subscription/failed?reason=verification_failed`,
      );
    }

    const expectedAmount = Number(invoice.total_amount || 0);

    if (expectedAmount && totalAmount !== expectedAmount) {
      await db.query(
        `
        UPDATE subscription_invoices
        SET status = 'cancelled'
        WHERE id = $1
        `,
        [invoice.id],
      );

      return res.redirect(
        `${process.env.API_BASE_URL}/subscription/failed?reason=amount_mismatch`,
      );
    }

    const paidInvoice = await subFinalizePaidSubscriptionInvoice({
      invoiceId: invoice.id,
      transactionId: refId || transactionUuid,
      paymentMethod: "esewa",
    });

    return res.redirect(
      `https://cafesync.online/subscription/success?invoice=${encodeURIComponent(
        paidInvoice.invoice_number,
      )}`,
    );
  } catch (error) {
    console.error("subscriptionEsewaSuccess error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to finalize eSewa subscription payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ===============================
// ESEWA SUBSCRIPTION FAILURE
// ===============================

exports.subscriptionEsewaFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.query;

    if (transaction_uuid) {
      await db.query(
        `
        UPDATE subscription_invoices
        SET status = 'cancelled'
        WHERE transaction_id = $1 AND status = 'pending'
        `,
        [transaction_uuid],
      );
    }

    return res.redirect(`${process.env.API_BASE_URL}/subscription/failed`);
  } catch (error) {
    console.error("subscriptionEsewaFailure error:", error);
    return errorResponse(res, 500, "Payment failure handling failed");
  }
};
