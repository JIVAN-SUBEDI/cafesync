
// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { errorResponse, findHotelById } = require("../utils/helpers");

// Helper function to sanitize hotel data
function sanitizeHotel(hotel) {
  if (!hotel) return null;
  const { admin_password_hash, ...safeHotel } = hotel;
  return safeHotel;
}


/* =========================
   GET AUTH STATUS
   GET /api/auth/status
========================= */
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

      switch (req.userRole) {
        case "hotel_admin":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/admin/dashboard`;
          break;

        case "kitchenstaff":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/kitchen/dashboard`;
          break;

        case "billing":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/billing/dashboard`;
          break;

        case "cashier":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/cashier/dashboard`;
          break;

        case "waiter":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/waiter/dashboard`;
          break;

        case "manager":
          redirectTo = `/hotel/${req.hotel.hotel_slug}/manager/dashboard`;
          break;

        case "staff":
        default:
          redirectTo = `/hotel/${req.hotel.hotel_slug}/staff/dashboard`;
          break;
      }

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
    // logger.error("Auth status error:", error);
    console.log(error)
    next(error);
  }
};
/* =========================
   REFRESH TOKEN
   POST /api/auth/refresh
========================= */
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.hotel_refresh_token || req.body.refreshToken;
    
    if (!refreshToken) {
      return errorResponse(res, 400, "Refresh token required");
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      return errorResponse(res, 401, "Invalid refresh token type");
    }

    // Create new access token
    const newToken = jwt.sign(
      {
        role: "hotel_admin",
        hotel_id: decoded.hotel_id,
        session_id: decoded.session_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set new cookie
    res.cookie("hotel_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      success: true,
      message: "Token refreshed",
      token: newToken
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Refresh token expired");
    }
    return errorResponse(res, 401, "Invalid refresh token");
  }
};