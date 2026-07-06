const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/helpers.js');
const {findById, getHotelWithPlan} = require('../models/hotelModel.js')
const MainAdmin = require('../models/MainAdmin.js');
const db = require("../config/database.js");


const getHotelToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.hotel_token) return req.cookies.hotel_token;
  if (req.cookies?.access_token) return req.cookies.access_token;
  if (req.headers["x-access-token"]) return req.headers["x-access-token"];

  return null;
};
const getSocketToken = (socket) => {
  // 1. auth.token (React best way)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  // 2. Authorization header
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 3. Cookies (IMPORTANT)
  const cookieHeader = socket.handshake.headers?.cookie;

  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, value] = c.split("=");
        return [key, decodeURIComponent(value)];
      })
    );

    if (cookies.hotel_token) return cookies.hotel_token;
    if (cookies.access_token) return cookies.access_token;
  }

  // 4. x-access-token
  if (socket.handshake.headers["x-access-token"]) {
    return socket.handshake.headers["x-access-token"];
  }

  return null;
};

// Try multiple JWT secrets because your old token and app access token
// may be signed with different env vars.
const verifyTokenWithKnownSecrets = (token) => {
  const possibleSecrets = [
    process.env.JWT_SECRET,
    process.env.JWT_ACCESS_SECRET,
    process.env.HOTEL_JWT_SECRET,
    process.env.HOTEL_JWT_ACCESS_SECRET,
  ].filter(Boolean);

  let lastError = null;

  for (const secret of possibleSecrets) {
    try {
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Unable to verify token");
};

// Normalize different token payload formats into one shape
const normalizeTokenPayload = (decoded) => {
  // support old token shape
  // { id, hotel_id, role, email, ... }

  // support app access token shape examples:
  // { user: { id, hotel_id, role } }
  // { sub, hotel_id, role }
  // { user_id, hotelId, role }
  // { id, hotelId, role }

  const userId =
    decoded?.id ||
    decoded?.user_id ||
    decoded?.userId ||
    decoded?.sub ||
    decoded?.user?.id ||
    null;

  const hotelId =
    decoded?.hotel_id ||
    decoded?.hotelId ||
    decoded?.hotel?.id ||
    decoded?.user?.hotel_id ||
    decoded?.user?.hotelId ||
    null;

  const role =
    decoded?.role ||
    decoded?.user?.role ||
    decoded?.user_role ||
    null;

  const email =
    decoded?.email ||
    decoded?.user?.email ||
    null;

  return {
    userId,
    hotelId,
    role,
    email,
    raw: decoded,
  };
};
function getTokenFromRequest(req) {



  // 1) Check cookies first
  let token = req.cookies?.hotel_token || req.cookies?.admin_token;
  
  // 2) Fallback to Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  return token;
}
function getStaffTokenFromRequest(req) {
  // 1) Check staff cookie first
  let token = req.cookies?.staff_token;

  // 2) Fallback to Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  return token;
}

// function getHotelToken(req) {
//   return req.cookies?.hotel_token
//     || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
// }

// function getAdminToken(req) {
//   return req.cookies?.admin_token
//     || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
// }




// middleware/auth.js
exports.protectAdmin = async (req, res, next) => {
  try {
    // Look for the correct cookie name
    const token =
      req.cookies?.admin_access || // ✅ Use "admin_access", not "admin_token"
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) return errorResponse(res, 401, "Not authorized, token missing");

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.role !== "main_admin") {
      return errorResponse(res, 401, "Invalid token type");
    }

    const adminId = decoded.sub;
    const admin = await MainAdmin.findById(adminId);
    
    if (!admin || !admin.is_active) {
      return errorResponse(res, 401, "Admin not found or inactive");
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Token expired");
    }
    return errorResponse(res, 401, "Invalid token");
  }
};

// const jwt = require("jsonwebtoken");
// const db = require("../config/db");
// const { errorResponse } = require("../utils/response");
// const { findById } = require("../models/hotelModel");

// Reuse your existing token getter if you already have one


exports.protectHotelAdmin = async (req, res, next) => {
  console.log("error")
  try {
    const token = getHotelToken(req);

    if (!token) {
      return errorResponse(res, 401, "Not authorized, token missing");
    }

    const decoded = verifyTokenWithKnownSecrets(token);
    console.log("decoded token =>", decoded);

    const normalized = normalizeTokenPayload(decoded);

    if (!normalized.userId || !normalized.hotelId) {
      return errorResponse(
        res,
        401,
        "Invalid token payload: userId or hotelId missing"
      );
    }

    const { rows } = await db.query(
      `
      SELECT
        id,
        hotel_id,
        full_name,
        email,
        role,
        staff_code,
        profile_image,
        is_active,
        is_email_verified,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
        AND hotel_id = $2
        AND is_active = true
      LIMIT 1
      `,
      [normalized.userId, normalized.hotelId]
    );

    const user = rows[0];

    if (!user) {
      return errorResponse(res, 401, "User not found or inactive");
    }

    // Since this is protectHotelAdmin, enforce allowed roles here
    // Adjust role names if your DB uses different values
    const allowedRoles = ["hotel_admin", "billing","waiter","kitchen"];
    if (!allowedRoles.includes(user.role)) {
      return errorResponse(res, 403, "Access denied: hotel admin only");
    }

    const hotel = await getHotelWithPlan(user.hotel_id);

    if (!hotel || !hotel.is_active) {
      return errorResponse(res, 401, "Hotel not found or inactive");
    }

    req.token = token;
    req.tokenPayload = normalized.raw;

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    req.hotel = hotel;
    req.hotelId = hotel.id;

    req.isAuthenticated = true;

    return next();
  } catch (e) {
    console.log("protectHotelAdmin error =>", e);

    if (e.name === "TokenExpiredError") {
      return errorResponse(res, 401, "Token expired");
    }

    return errorResponse(res, 401, "Invalid token");
  }
};
// ===================== AUTH STATUS CHECK MIDDLEWARE =====================
// This middleware doesn't require authentication, just checks if token exists
exports.checkAuthStatus = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      req.hotel = null;
      req.hotelId = null;
      req.isAuthenticated = false;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role === "hotel_admin") {
        const hotel = await findHotelById(decoded.hotel_id);
        if (hotel && hotel.is_active) {
          req.hotel = hotel;
          req.hotelId = hotel.id;
          req.isAuthenticated = true;
          req.userRole = "hotel_admin";
        } else {
          req.hotel = null;
          req.hotelId = null;
          req.isAuthenticated = false;
        }
      } else if (decoded.role === "main_admin") {
        // Handle main admin if needed
        req.isAuthenticated = true;
        req.userRole = "main_admin";
      } else {
        req.isAuthenticated = false;
      }
    } catch (tokenError) {
      // Invalid/expired token
      req.hotel = null;
      req.hotelId = null;
      req.isAuthenticated = false;
    }
    
    next();
  } catch (e) {
    console.error("Auth status check error:", e);
    req.hotel = null;
    req.hotelId = null;
    req.isAuthenticated = false;
    next();
  }
};

// ===================== OPTIONAL HOTEL AUTH MIDDLEWARE =====================
// Use this when you want to attach hotel data if authenticated, but don't require auth
exports.optionalHotelAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      req.hotel = null;
      req.hotelId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "hotel_admin") {
      const hotel = await findHotelById(decoded.hotel_id);
      if (hotel && hotel.is_active) {
        req.hotel = hotel;
        req.hotelId = hotel.id;
      }
    }
    
    next();
  } catch (e) {
    // If token is invalid, just continue without auth
    req.hotel = null;
    req.hotelId = null;
    next();
  }
};



exports.protectStaff = async (req, res, next) => {
  try {
    const token = getStaffTokenFromRequest(req);

    if (!token) return errorResponse(res, 401, "Not authorized, staff token missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Make sure token type is STAFF
    if (decoded.role !== "staff") {
      return errorResponse(res, 401, "Invalid token role");
    }

    // ✅ decoded should contain: staff_id, hotel_id
    const staffId = decoded.staff_id || decoded.id; // support both if you used id
    const hotelId = decoded.hotel_id;

    if (!staffId || !hotelId) {
      return errorResponse(res, 401, "Invalid token payload");
    }

    // ✅ Verify staff exists + active + belongs to same hotel
    const { rows } = await db.query(
      `SELECT id, hotel_id, staff_code, full_name, role, phone_number, email, permissions, is_active, created_at, updated_at
       FROM staff
       WHERE id = $1 AND hotel_id = $2 AND is_active = true`,
      [staffId, hotelId]
    );

    if (rows.length === 0) {
      return errorResponse(res, 401, "Staff not found or inactive");
    }

    req.staff = rows[0];
    req.staffId = rows[0].id;
    req.hotelId = rows[0].hotel_id;
    req.userRole = "staff";

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") return errorResponse(res, 401, "Token expired");
    return errorResponse(res, 401, "Invalid token");
  }
};
exports.socketProtectHotelUser = async (socket, next) => {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error("No token"));
    }

    const decoded = verifyTokenWithKnownSecrets(token);
    const normalized = normalizeTokenPayload(decoded);

    if (!normalized.userId || !normalized.hotelId) {
      return next(new Error("Invalid token payload"));
    }

    const { rows } = await db.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
        AND hotel_id = $2
        AND is_active = true
      LIMIT 1
      `,
      [normalized.userId, normalized.hotelId]
    );

    const user = rows[0];

    if (!user) {
      return next(new Error("User not found"));
    }

    const hotel = await findById(user.hotel_id);

    if (!hotel || !hotel.is_active) {
      return next(new Error("Hotel not found"));
    }

    socket.user = user;
    socket.hotelId = hotel.id;

    // ✅ JOIN HOTEL ROOM
    socket.join(`hotel:${hotel.id}`);

    console.log(`Socket ${socket.id} joined hotel:${hotel.id}`);

    next();
  } catch (err) {
    console.log("Socket auth error:", err);
    next(new Error("Unauthorized"));
  }
}

