const jwt = require("jsonwebtoken");

const {
  hashPassword,
  verifyPassword,
  generateToken,

} = require("../utils/helpers");

const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");

const MainAdmin = require("../models/MainAdmin");
const ActivityLog = require("../models/ActivityLog");
const logger = require("../utils/logger.js");
const { clear } = require("winston");

// ----------------------
// small helpers
// ----------------------
const maskEmail = (email = "") => {
  if (!email || typeof email !== "string") return "unknown";
  const [name, domain] = email.split("@");
  if (!domain) return `${email.slice(0, 2)}***`;
  return `${(name || "").slice(0, 2)}***@${domain}`;
};

const makeRequestId = (req) =>
  req.headers["x-request-id"] ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

const signAccess = (admin) =>
  jwt.sign(
    { sub: admin.id, role: "main_admin" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );

const signRefresh = (admin) =>
  jwt.sign(
    { sub: admin.id, role: "main_admin", type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );

/**
 * IMPORTANT:
 * Your activity_logs table columns are:
 * user_id, user_type, action, resource_type, resource_id, details, ip_address, user_agent, created_at
 * So we MUST NOT insert session_id / hotel_id etc.
 */
const logActivitySafe = async ({
  user_id = null,
  user_type = "guest",
  action,
  resource_type = null,
  resource_id = null,
  details = {},
  ip_address = null,
  user_agent = null,
  requestId = null,
}) => {
  try {
    await ActivityLog.create({
      user_id,
      user_type,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
    });
  } catch (e) {
    logger.warn("ActivityLog.create failed", {
      requestId,
      action,
      user_id,
      user_type,
      error: e?.message,
    });
  }
};

// ======================
// ADMIN LOGIN
// ======================
exports.adminLogin = async (req, res) => {
  const start = Date.now();
  const requestId = makeRequestId(req);
  const ip = req.ip;
  const userAgent = req.get("User-Agent");
  console.log(process.env.JWT_ACCESS_SECRET)

  try {

    const { email, password } = req.body;
    console.log("this is the admin  req body:- ", req.body);

    logger.security("ADMIN_LOGIN_ATTEMPT", "info", {
      requestId,
      ip,
      userAgent,
      email: maskEmail(email),
    });

    // find admin
    let admin;
    try {
      admin = await MainAdmin.findByEmail(email);
    } catch (dbErr) {
      logger.error("ADMIN_LOGIN_DB_ERROR_FIND_EMAIL", {
        requestId,
        ip,
        userAgent,
        email: maskEmail(email),
        error: dbErr?.message,
        stack: dbErr?.stack,
      });
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (!admin) {
      logger.security("ADMIN_LOGIN_FAILED", "warn", {
        requestId,
        reason: "EMAIL_NOT_FOUND",
        ip,
        userAgent,
        email: maskEmail(email),
      });

      // Non-blocking activity log (matches your table schema)
      logActivitySafe({
        requestId,
        user_id: null,
        user_type: "guest",
        action: "LOGIN_FAILED",
        details: { email: maskEmail(email), reason: "EMAIL_NOT_FOUND" },
        ip_address: ip,
        user_agent: userAgent,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!admin.is_active) {
      logger.security("ADMIN_LOGIN_FAILED", "warn", {
        requestId,
        reason: "ACCOUNT_INACTIVE",
        adminId: admin.id,
        ip,
        userAgent,
      });

      logActivitySafe({
        requestId,
        user_id: admin.id,
        user_type: "main_admin",
        action: "LOGIN_FAILED",
        details: { reason: "ACCOUNT_INACTIVE" },
        ip_address: ip,
        user_agent: userAgent,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // password verify
    let isValid = false;
    try {
      isValid = await verifyPassword(password, admin.password_hash);
    } catch (hashErr) {
      logger.error("ADMIN_LOGIN_HASH_VERIFY_ERROR", {
        requestId,
        adminId: admin.id,
        ip,
        userAgent,
        error: hashErr?.message,
        stack: hashErr?.stack,
      });
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (!isValid) {
      logger.security("ADMIN_LOGIN_FAILED", "warn", {
        requestId,
        reason: "WRONG_PASSWORD",
        adminId: admin.id,
        ip,
        userAgent,
      });

      logActivitySafe({
        requestId,
        user_id: admin.id,
        user_type: "main_admin",
        action: "LOGIN_FAILED",
        details: { reason: "WRONG_PASSWORD" },
        ip_address: ip,
        user_agent: userAgent,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }


    const accessToken = signAccess(admin);
    const refreshToken = signRefresh(admin);

    setAuthCookies(res, accessToken, refreshToken);

    logger.security("ADMIN_LOGIN_SUCCESS", "info", {
      requestId,
      adminId: admin.id,
      ip,
      userAgent,
      ms: Date.now() - start,
    });

    // non-blocking log
    logActivitySafe({
      requestId,
      user_id: admin.id,
      user_type: "main_admin",
      action: "LOGIN_SUCCESS",
      details: {},
      ip_address: ip,
      user_agent: userAgent,
    });

    return res.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
      },
    });
  } catch (err) {
    logger.error("ADMIN_LOGIN_UNHANDLED_ERROR", {
      requestId,
      ip,
      userAgent,
      error: err?.message,
      stack: err?.stack,
      ms: Date.now() - start,
    });

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================
// REFRESH TOKEN
// ======================// ======================
// REFRESH TOKEN (Main Admin)
// ======================
exports.refreshToken = async (req, res) => {
  const start = Date.now();
  const requestId = makeRequestId(req);
  const ip = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    // ✅ Only cookie refresh (recommended). Keep body fallback only for Postman tests.
    const refreshToken =
      req.cookies?.admin_refresh || req.body?.refreshToken || null;

    if (!refreshToken) {
      logger.security("ADMIN_REFRESH_FAILED", "warn", {
        requestId,
        reason: "NO_REFRESH_TOKEN",
        ip,
        userAgent,
      });

      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
    }

    // ✅ Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      logger.security("ADMIN_REFRESH_FAILED", "warn", {
        requestId,
        reason: "INVALID_OR_EXPIRED_REFRESH",
        ip,
        userAgent,
        error: e?.message,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    // ✅ Validate token type + role
    if (decoded?.type !== "refresh" || decoded?.role !== "main_admin") {
      logger.security("ADMIN_REFRESH_FAILED", "warn", {
        requestId,
        reason: "WRONG_TOKEN_TYPE_OR_ROLE",
        ip,
        userAgent,
        decodedType: decoded?.type,
        decodedRole: decoded?.role,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // ✅ You sign tokens with { sub: admin.id }, so read sub (NOT decoded.id)
    const adminId = decoded.sub;

    if (!adminId) {
      logger.security("ADMIN_REFRESH_FAILED", "warn", {
        requestId,
        reason: "MISSING_SUB",
        ip,
        userAgent,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // ✅ Ensure admin still exists + active
    let admin;
    try {
      admin = await MainAdmin.findById(adminId);
    } catch (dbErr) {
      logger.error("ADMIN_REFRESH_DB_ERROR_FIND_ID", {
        requestId,
        ip,
        userAgent,
        adminId,
        error: dbErr?.message,
        stack: dbErr?.stack,
      });

      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (!admin || !admin.is_active) {
      logger.security("ADMIN_REFRESH_FAILED", "warn", {
        requestId,
        reason: "ADMIN_NOT_FOUND_OR_INACTIVE",
        ip,
        userAgent,
        adminId,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // ✅ Issue new tokens (access short, refresh long)
    const newAccessToken = signAccess(admin);

    // 🔁 Refresh rotation (recommended)
    const newRefreshToken = signRefresh(admin);

    // ✅ Set cookies (make sure your setAuthCookies sets admin_token + admin_refresh)
    setAuthCookies(res, newAccessToken, newRefreshToken);

    logger.security("ADMIN_REFRESH_SUCCESS", "info", {
      requestId,
      adminId: admin.id,
      ip,
      userAgent,
      ms: Date.now() - start,
    });

    // ✅ audit log (non-blocking)
    logActivitySafe({
      requestId,
      user_id: admin.id,
      user_type: "main_admin",
      action: "TOKEN_REFRESH",
      details: { rotated: true },
      ip_address: ip,
      user_agent: userAgent,
    });

    return res.json({
      success: true,
      // optional: don't send tokens in body since cookies are HTTP-only
    });
  } catch (err) {
    logger.error("ADMIN_REFRESH_UNHANDLED_ERROR", {
      requestId,
      ip,
      userAgent,
      error: err?.message,
      stack: err?.stack,
      ms: Date.now() - start,
    });

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================
// GET PROFILE
// ======================
exports.getAdminProfile = async (req, res) => {
  const requestId = makeRequestId(req);

  try {
    // assumes protect middleware sets req.admin
    if (!req.admin) {
      logger.security("ADMIN_PROFILE_UNAUTHORIZED", "warn", {
        requestId,
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return res.json({
      success: true,
      admin: {
        id: req.admin.id,
        email: req.admin.email,
        full_name: req.admin.full_name,
        is_active: req.admin.is_active,
      },
    });
  } catch (err) {
    logger.error("ADMIN_PROFILE_ERROR", {
      requestId,
      error: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================
// LOGOUT
// ======================
exports.adminLogout = async (req, res) => {
  const requestId = makeRequestId(req);
  const ip = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    console.log('this is the logout function')
    clearAuthCookies(res);
    console.log('cleared cookies')

    // non-blocking activity log
    const adminId = req.admin?.id ?? null;
    logActivitySafe({
      requestId,
      user_id: adminId,
      user_type: "main_admin",
      action: "LOGOUT",
      details: {},
      ip_address: ip,
      user_agent: userAgent,
    });

    logger.security("ADMIN_LOGOUT_SUCCESS", "info", {
      requestId,
      adminId,
      ip,
      userAgent,
    });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error("ADMIN_LOGOUT_ERROR", {
      requestId,
      ip,
      userAgent,
      error: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

exports.createAdmin = async (req, res, next) => {
  const requestId = makeRequestId(req);
  const ip = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    const { email, password, full_name } = req.body;

    logger.audit("CREATE_ADMIN_ATTEMPT", {
      requestId,
      ip,
      userAgent,
      email: maskEmail(email),
    });

    const exists = await MainAdmin.findByEmail(email);
    if (exists) {
      logger.security("CREATE_ADMIN_FAILED", "warn", {
        requestId,
        reason: "EMAIL_ALREADY_EXISTS",
        email: maskEmail(email),
        ip,
      });

      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const password_hash = await hashPassword(password);

    const admin = await MainAdmin.createAdmin({
      email,
      password_hash,
      full_name,
    });

    logger.audit("CREATE_ADMIN_SUCCESS", {
      requestId,
      adminId: admin?.id,
      ip,
    });

    // non-blocking activity log
    logActivitySafe({
      requestId,
      user_id: admin?.id ?? null,
      user_type: "main_admin",
      action: "CREATE_ADMIN",
      details: { created_email: maskEmail(email) },
      ip_address: ip,
      user_agent: userAgent,
    });

    return res.json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (err) {
    logger.error("CREATE_ADMIN_ERROR", {
      requestId,
      ip,
      userAgent,
      error: err?.message,
      stack: err?.stack,
    });
    return next(err);
  }
};
