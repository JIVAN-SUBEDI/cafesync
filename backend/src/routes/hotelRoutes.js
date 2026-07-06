
const express = require("express");
const { z } = require("zod");
const router = express.Router();
const hotelController = require("../controllers/hotelController.js");
const { protectHotelAdmin } = require("../middleware/auth.js");
const { checkTenantSlug } = require("../controllers/slugController.js");
const authController = require("../controllers/authController.js");
const rateLimit = require("express-rate-limit");
const upload = require('../middleware/upload.js');

const hotelAuthController = require("../controllers/hotelAuthController.js");
const {registrationSchema,loginSchema} = require("../validators/hotelAuthValidation.js")
const paymentMethodController = require('../controllers/paymentMethodController.js')
// ===================== VALIDATION MIDDLEWARE =====================
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// ===================== SCHEMAS =====================

/**
 * Update Hotel Profile Schema
 */
const updateHotelSchema = z.object({
  hotel_name: z.string()
    .min(2, "Hotel name must be at least 2 characters")
    .max(100, "Hotel name must be less than 100 characters")
    .optional(),
  hotel_slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),

  hotel_phone: z.string()
    .regex(/^[+]?[\d\s-]{10,}$/, "Invalid phone number format")
    .optional(),
  hotel_address: z.string()
    .max(500, "Address must be less than 500 characters")
    .optional(),
  city: z.string()
    .max(100, "City name must be less than 100 characters")
    .optional(),
  country: z.string()
    .max(100, "Country name must be less than 100 characters")
    .optional(),
  timezone: z.string().optional(),
  currency: z.enum(["USD", "NPR", "INR", "EUR", "GBP","AED"]).optional(),
  tax_rate: z.number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%")
    .optional(),
  service_charge: z.number()
    .min(0, "Service charge cannot be negative")
    .max(100, "Service charge cannot exceed 100%")
    .optional()
});

/**
 * Change Password Schema
 */
const changePasswordSchema = z.object({
  old_password: z.string()
    .min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      "Password must contain uppercase, lowercase, number, and special character"),
  confirm_password: z.string()
    .min(1, "Please confirm your password")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

/**
 * Recovery Email Schema
 */
const recoveryEmailSchema = z.object({
  recovery_email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
});

/**
 * Request OTP Schema
 */
const requestOTPSchema = z.object({
  admin_email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
});

/**
 * Verify OTP Schema
 */
const verifyOTPSchema = z.object({
  otp: z.string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  admin_email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
});

/**
 * Change Password with OTP Schema
 */
const changePasswordWithOTPSchema = z.object({
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  tempToken: z.string()
    .min(1, "Verification token is required"),
  admin_email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
});
/**
 * Refresh Token Schema
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string().optional()
});

// ===================== RATE LIMITERS =====================
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2,
  message: {
    success: false,
    message: 'Too many resend attempts. Please try again after 5 minutes.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===================== PUBLIC ROUTES =====================


router.post(
  "/register/start",
  upload.single("image"),
  validate(registrationSchema),
  hotelAuthController.startHotelRegistration
);

router.get(
  "/registration/payment/esewa/success",
  hotelAuthController.esewaSuccess
);

router.get(
  "/registration/payment/esewa/failure",
  hotelAuthController.esewaFailure
);

router.get(
  "/registration/payment/khalti/callback",
  hotelAuthController.KhaltiCallBack
);


router.post("/login", validate(loginSchema), hotelAuthController.loginHotel);

router.get("/exists/:slug", checkTenantSlug);
router.get("/me", protectHotelAdmin, hotelController.getMyHotel);

router.put("/me", protectHotelAdmin, validate(updateHotelSchema), hotelController.updateMyHotel);
router.put("/accounts/profile",upload.single("profile_image"), hotelAuthController.updateProfile);
router.post("/logout", protectHotelAdmin, hotelController.logoutHotelAdmin);
router.patch(
  "/me/password",
  protectHotelAdmin,
  validate(changePasswordSchema),
  hotelController.changeMyPassword
);

// ===================== RECOVERY EMAIL MANAGEMENT =====================
router.get(
  "/me/recovery-email",
  protectHotelAdmin,
  hotelController.getRecoveryEmail
);

router.post(
  "/me/recovery-email",
  protectHotelAdmin,
  validate(recoveryEmailSchema),
  hotelController.addOrUpdateRecoveryEmail
);


router.delete(
  "/me/recovery-email",
  protectHotelAdmin,
  hotelController.removeRecoveryEmail
);
//payment methods routes
router.get(
  "/hotels/:hotelSlug/payment-methods",
  protectHotelAdmin,
  paymentMethodController.getPaymentMethodsByHotel
);

router.post(
  "/hotels/:hotelId/payment-methods",
  protectHotelAdmin,
  paymentMethodController.createPaymentMethod
);

router.put(
  "/payment-methods/:id",
  protectHotelAdmin,
  paymentMethodController.updatePaymentMethod
);

router.delete(
  "/payment-methods/:id",
  protectHotelAdmin,
  paymentMethodController.deletePaymentMethod
);

// ===================== PASSWORD RESET WITH OTP =====================


router.post(
  '/auth/request-password-change-otp',
  otpLimiter,
  
  hotelController.requestPasswordChangeOTP
);
router.post(
  '/auth/resend-password-change-otp',
  resendOtpLimiter,
  validate(requestOTPSchema),
  hotelController.resendPasswordChangeOTP
);


router.post(
  '/auth/verify-password-change-otp',
  
  hotelController.verifyPasswordChangeOTP
);


router.post(
  '/auth/change-password-with-otp',

  hotelController.changePasswordWithOTP
);

// ===================== AUTHENTICATION STATUS =====================

router.get("/auth/status",protectHotelAdmin,hotelAuthController.getAuthStatus);


router.post("/refresh", authController.refreshToken);
// subscription routes
router.post(
  "/subscription/upgrade",
protectHotelAdmin,  hotelAuthController.upgradeDowngradeBilling
);

router.get(
  "/subscription/invoices",
protectHotelAdmin,  hotelAuthController.getHotelSubscriptionInvoices
);
router.get(
  "/subscription/invoices/:invoiceId",
  protectHotelAdmin,
  hotelAuthController.getSingleSubscriptionInvoice
);
router.get(
  "/subscription/payment/khalti/callback",
  hotelAuthController.subscriptionKhaltiCallback
);

router.get(
  "/subscription/payment/esewa/success",
  hotelAuthController.subscriptionEsewaSuccess
);

router.get(
  "/subscription/payment/esewa/failure",
  hotelAuthController.subscriptionEsewaFailure
);

module.exports = router;


