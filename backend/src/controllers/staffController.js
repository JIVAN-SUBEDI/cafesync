const db = require("../config/database");
const { errorResponse } = require("../utils/helpers.js");
const bcrypt = require("bcryptjs");
const ActivityLog = require("../models/ActivityLog");
const { validationResult } = require("express-validator");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary.js");
const User = require("../models/UsersModel.js");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger.js");

/* =========================
   GET ALL STAFF
   GET /api/hotel/staff
   Uses users table
========================= */
exports.getAllStaff = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { role, status, page = 1, limit = 20, search } = req.query;

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 20;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT
        u.id,
        u.staff_code,
        u.full_name,
        u.role,
        u.phone_number,
        u.email,
        u.profile_image,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.id END) AS today_orders,
        COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total_amount END), 0) AS today_sales
      FROM users u
      LEFT JOIN orders o ON u.id = o.waiter_id
      WHERE u.hotel_id = $1
    `;

    let countQuery = `
      SELECT COUNT(*) 
      FROM users u
      WHERE u.hotel_id = $1
    `;

    const params = [hotelId];
    const countParams = [hotelId];
    let paramCount = 1;
    let countParamCount = 1;

    if (role) {
      paramCount++;
      countParamCount++;
      query += ` AND u.role = $${paramCount}`;
      countQuery += ` AND u.role = $${countParamCount}`;
      params.push(role);
      countParams.push(role);
    }

    if (status === "active") {
      query += ` AND u.is_active = true`;
      countQuery += ` AND u.is_active = true`;
    } else if (status === "inactive") {
      query += ` AND u.is_active = false`;
      countQuery += ` AND u.is_active = false`;
    }

    if (search) {
      paramCount++;
      countParamCount++;
      query += ` AND (
        u.full_name ILIKE $${paramCount}
        OR u.email ILIKE $${paramCount}
        OR COALESCE(u.phone_number, '') ILIKE $${paramCount}
        OR COALESCE(u.staff_code, '') ILIKE $${paramCount}
      )`;
      countQuery += ` AND (
        u.full_name ILIKE $${countParamCount}
        OR u.email ILIKE $${countParamCount}
        OR COALESCE(u.phone_number, '') ILIKE $${countParamCount}
        OR COALESCE(u.staff_code, '') ILIKE $${countParamCount}
      )`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramCount + 1}
      OFFSET $${paramCount + 2}
    `;

    params.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    const total = Number(countResult.rows[0].count || 0);
    const totalPages = Math.ceil(total / limitNum);

    const staff = result.rows.map((member) => ({
      id: member.id,
      staff_code: member.staff_code,
      full_name: member.full_name,
      role: member.role,
      phone_number: member.phone_number,
      email: member.email,
      profile_image: member.profile_image,
      is_active: member.is_active,
      status: member.is_active ? "active" : "inactive",
      last_login: member.last_login,
      total_orders: Number(member.total_orders) || 0,
      today_orders: Number(member.today_orders) || 0,
      today_sales: Number(member.today_sales) || 0,
      created_at: member.created_at,
      updated_at: member.updated_at,
    }));

    const roleStatsQuery = await db.query(
      `
      SELECT
        role,
        COUNT(*) AS count,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) AS active_count
      FROM users
      WHERE hotel_id = $1
      GROUP BY role
      ORDER BY COUNT(*) DESC
      `,
      [hotelId]
    );

    const roleStats = roleStatsQuery.rows;

    return res.json({
      success: true,
      staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
      },
      statistics: {
        total_staff: total,
        active_staff: roleStats.reduce(
          (sum, stat) => sum + Number(stat.active_count || 0),
          0
        ),
        role_distribution: roleStats.map((stat) => ({
          role: stat.role,
          total: Number(stat.count || 0),
          active: Number(stat.active_count || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Get all staff error:", error);
    next(error);
  }
};

/* =========================
   GET STAFF BY ID
   GET /api/hotel/staff/:id
========================= */
exports.getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotelId = req.hotelId;

    const query = `
      SELECT
        u.id,
        u.hotel_id,
        u.staff_code,
        u.full_name,
        u.role,
        u.phone_number,
        u.email,
        u.profile_image,
        u.is_active,
        u.is_email_verified,
        u.failed_login_attempts,
        u.locked_until,
        u.last_login,
        u.created_by,
        u.updated_by,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM orders WHERE waiter_id = u.id AND DATE(created_at) = CURRENT_DATE) AS today_orders,
        (SELECT COUNT(*) FROM orders WHERE waiter_id = u.id) AS total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE waiter_id = u.id AND DATE(created_at) = CURRENT_DATE) AS today_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE waiter_id = u.id) AS total_sales,
        (SELECT COUNT(*) FROM orders WHERE waiter_id = u.id AND status = 'completed') AS completed_orders
      FROM users u
      WHERE u.id = $1 AND u.hotel_id = $2
      LIMIT 1
    `;

    const result = await db.query(query, [id, hotelId]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Staff member not found");
    }

    const user = result.rows[0];

    const recentOrders = await db.query(
      `
      SELECT
        o.id,
        o.order_number,
        o.table_id,
        t.table_number,
        o.customer_name,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      LEFT JOIN hotel_tables t ON o.table_id = t.id
      WHERE o.waiter_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
      `,
      [id]
    );

    const monthlyPerformance = await db.query(
      `
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        COUNT(*) AS order_count,
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
      FROM orders
      WHERE waiter_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      `,
      [id]
    );

    return res.json({
      success: true,
      staff: {
        id: user.id,
        hotel_id: user.hotel_id,
        staff_code: user.staff_code,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
        email: user.email,
        profile_image: user.profile_image,
        is_active: user.is_active,
        is_email_verified: user.is_email_verified,
        failed_login_attempts: user.failed_login_attempts,
        locked_until: user.locked_until,
        last_login: user.last_login,
        statistics: {
          today_orders: Number(user.today_orders) || 0,
          today_sales: Number(user.today_sales) || 0,
          total_orders: Number(user.total_orders) || 0,
          total_sales: Number(user.total_sales) || 0,
          completed_orders: Number(user.completed_orders) || 0,
          completion_rate:
            Number(user.total_orders) > 0
              ? Math.round(
                  (Number(user.completed_orders) / Number(user.total_orders)) * 100
                )
              : 0,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      recent_orders: recentOrders.rows,
      monthly_performance: monthlyPerformance.rows.map((row) => ({
        month: row.month,
        order_count: Number(row.order_count) || 0,
        total_sales: Number(row.total_sales) || 0,
        avg_order_value: Number(row.avg_order_value) || 0,
      })),
    });
  } catch (error) {
    console.error("Get staff by id error:", error);
    next(error);
  }
};

/* =========================
   CREATE STAFF
   POST /api/hotel/staff
========================= */
exports.createStaff = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const adminId = req.user?.id || req.hotelId || null;
    const { full_name, role, phone_number, email, password } = req.body;

    if (!full_name || !role || !email || !password) {
      return errorResponse(
        res,
        400,
        "Full name, role, email, and password are required"
      );
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

    if (!passwordRegex.test(String(password))) {
      return errorResponse(
        res,
        400,
        "Password must be at least 8 chars and include uppercase, lowercase, number, and symbol."
      );
    }

    if (phone_number && !/^\d{10}$/.test(String(phone_number))) {
      return errorResponse(res, 400, "Phone number must be exactly 10 digits");
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findByEmailAndHotelId(cleanEmail, hotelId);
    if (existingUser) {
      return errorResponse(res, 409, "Email already exists");
    }

    const limitCheck = await db.query(
      `
      SELECT
        COUNT(u.id) AS current_count,
        h.max_staff_allowed
      FROM hotels h
      LEFT JOIN users u ON u.hotel_id = h.id AND u.is_active = true
      WHERE h.id = $1
      GROUP BY h.max_staff_allowed
      `,
      [hotelId]
    );

    if (limitCheck.rows.length > 0) {
      const current = Number(limitCheck.rows[0].current_count || 0);
      const maxAllowed = Number(limitCheck.rows[0].max_staff_allowed || 0);

      if (maxAllowed > 0 && current >= maxAllowed) {
        return errorResponse(
          res,
          403,
          `Staff limit reached. Maximum allowed: ${maxAllowed}`
        );
      }
    }

    let profile_image = null;

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/staff/${hotelId}`,
      });
      profile_image = uploadedImage.secure_url;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      hotel_id: hotelId,
      full_name,
      email: cleanEmail,
      phone_number: phone_number || null,
      password_hash,
      role,
      profile_image,
      is_active: true,
      is_email_verified: false,
      created_by: adminId,
      updated_by: adminId,
    });

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      staff: User.sanitize(newUser),
    });
  } catch (error) {
    console.error("Create staff error:", error);

    if (error.code === "23505") {
      if (String(error.constraint).includes("email")) {
        return errorResponse(res, 409, "Email already exists");
      }
      if (String(error.constraint).includes("phone")) {
        return errorResponse(res, 409, "Phone number already exists");
      }
      if (String(error.constraint).includes("staff_code")) {
        return errorResponse(res, 409, "Staff code already exists");
      }
      return errorResponse(res, 409, "Duplicate entry");
    }

    next(error);
  }
};

/* =========================
   UPDATE STAFF
   PATCH /api/hotel/staff/:id
========================= */
exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotelId = req.hotelId;
    const adminId = req.user?.id || req.hotelId || null;
    const updateData = { ...req.body };

    const existingUser = await db.query(
      `SELECT * FROM users WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
      [id, hotelId]
    );

    if (existingUser.rows.length === 0) {
      return errorResponse(res, 404, "Staff member not found");
    }

    if (
      updateData.phone_number !== undefined &&
      updateData.phone_number !== null &&
      updateData.phone_number !== "" &&
      !/^\d{10}$/.test(String(updateData.phone_number))
    ) {
      return errorResponse(res, 400, "Phone number must be exactly 10 digits");
    }

    if (updateData.email !== undefined) {
      updateData.email = String(updateData.email).trim().toLowerCase();
    }

    if (updateData.password !== undefined && updateData.password !== "") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

      if (!passwordRegex.test(updateData.password)) {
        return errorResponse(
          res,
          400,
          "Password must be at least 8 chars and include uppercase, lowercase, number, and symbol."
        );
      }

      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
    }

    delete updateData.password;

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/staff/${hotelId}`,
      });
      updateData.profile_image = uploadedImage.secure_url;
    }

    updateData.updated_by = adminId;

    const safePayload = {
      full_name: updateData.full_name,
      email: updateData.email,
      phone_number: updateData.phone_number,
      password_hash: updateData.password_hash,
      role: updateData.role,
      staff_code: updateData.staff_code,
      profile_image: updateData.profile_image,
      is_active: updateData.is_active,
      is_email_verified: updateData.is_email_verified,
      failed_login_attempts: updateData.failed_login_attempts,
      locked_until: updateData.locked_until,
      last_login: updateData.last_login,
      updated_by: updateData.updated_by,
    };

    const updatedUser = await User.updateById(id, safePayload);

    return res.json({
      success: true,
      message: "Staff member updated successfully",
      staff: User.sanitize(updatedUser),
    });
  } catch (error) {
    console.error("Update staff error:", error);

    if (error.message === "No valid fields provided for update") {
      return errorResponse(res, 400, "No valid fields to update");
    }

    if (error.code === "23505") {
      if (String(error.constraint).includes("email")) {
        return errorResponse(res, 409, "Email already exists");
      }
      if (String(error.constraint).includes("phone")) {
        return errorResponse(res, 409, "Phone number already exists");
      }
      if (String(error.constraint).includes("staff_code")) {
        return errorResponse(res, 409, "Staff code already exists");
      }
      return errorResponse(res, 409, "Duplicate entry");
    }

    next(error);
  }
};

/* =========================
   DELETE STAFF
   DELETE /api/hotel/staff/:id
========================= */
exports.deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotelId = req.hotelId;

    const activeOrders = await db.query(
      `
      SELECT COUNT(*) AS active_count
      FROM orders
      WHERE waiter_id = $1
        AND status NOT IN ('completed', 'cancelled')
      `,
      [id]
    );

    if (Number(activeOrders.rows[0].active_count) > 0) {
      return errorResponse(res, 400, "Cannot delete staff with active orders");
    }

    const existing = await db.query(
      `SELECT * FROM users WHERE id = $1 AND hotel_id = $2 LIMIT 1`,
      [id, hotelId]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Staff member not found");
    }

    const deleted = await User.deleteById(id);

    return res.json({
      success: true,
      message: "Staff member deleted successfully",
      deleted_staff: User.sanitize(deleted),
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    if (error.code === "23503") {
      return errorResponse(
        res,
        400,
        "Cannot delete staff because it is referenced in other records"
      );
    }

    next(error);
  }
};

/* =========================
   STAFF LOGIN
========================= */
exports.staffLogin = async (req, res, next) => {
  const startTime = Date.now();
  const sessionId = uuidv4();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { hotel_id, email, password, rememberMe = false } = req.body;

    if (!hotel_id || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID, email, and password are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Email must be a valid email address",
      });
    }

    logger?.info?.("Staff login attempt started", {
      sessionId,
      email: cleanEmail.substring(0, 3) + "***",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      hotel_id,
    });

    const lockoutKey = `staff_lockout_${hotel_id}_${cleanEmail}`;
    const failedKey = `staff_failed_${hotel_id}_${cleanEmail}`;

    const lockout = req.app.locals.rateLimitStore?.get(lockoutKey);
    if (lockout && lockout.expiresAt > Date.now()) {
      const remainingTime = Math.ceil((lockout.expiresAt - Date.now()) / 1000);

      await ActivityLog.logActivity({
        session_id: sessionId,
        hotel_id,
        user_id: null,
        user_type: "staff",
        action: "STAFF_LOGIN_BLOCKED_LOCKOUT",
        details: JSON.stringify({
          email: cleanEmail,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          remainingTime,
        }),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      return res.status(429).json({
        success: false,
        error: "ACCOUNT_LOCKED",
        message: "Account temporarily locked due to too many failed attempts",
        retryAfter: remainingTime,
      });
    }

    const user = await User.findByEmailAndHotelId(cleanEmail, hotel_id);

    await new Promise((resolve) =>
      setTimeout(resolve, 120 + Math.random() * 120)
    );

    if (!user) {
      const current = req.app.locals.rateLimitStore?.get(failedKey) || {
        attempts: 0,
        firstAttempt: Date.now(),
      };

      current.attempts++;
      current.lastAttempt = Date.now();
      req.app.locals.rateLimitStore?.set(failedKey, current);

      if (current.attempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000;
        req.app.locals.rateLimitStore?.set(lockoutKey, {
          attempts: current.attempts,
          expiresAt: Date.now() + lockoutDuration,
        });
      }

      await ActivityLog.logActivity({
        session_id: sessionId,
        hotel_id,
        user_id: null,
        user_type: "guest",
        action: "STAFF_LOGIN_FAILED",
        details: JSON.stringify({
          reason: "INVALID_CREDENTIALS",
          email: cleanEmail,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        }),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (!user.password_hash) {
      return res.status(403).json({
        success: false,
        error: "PASSWORD_NOT_SET",
        message: "Password not set for this account. Please contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const current = req.app.locals.rateLimitStore?.get(failedKey) || {
        attempts: 0,
        firstAttempt: Date.now(),
      };

      current.attempts++;
      current.lastAttempt = Date.now();
      req.app.locals.rateLimitStore?.set(failedKey, current);

      if (current.attempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000;
        req.app.locals.rateLimitStore?.set(lockoutKey, {
          attempts: current.attempts,
          expiresAt: Date.now() + lockoutDuration,
        });
      }

      await ActivityLog.logActivity({
        session_id: sessionId,
        hotel_id: user.hotel_id,
        user_id: user.id,
        user_type: "staff",
        action: "STAFF_LOGIN_FAILED",
        details: JSON.stringify({
          reason: "INVALID_PASSWORD",
          email: cleanEmail,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          remainingAttempts: Math.max(0, 5 - current.attempts),
        }),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        remainingAttempts: Math.max(0, 5 - current.attempts),
      });
    }

    req.app.locals.rateLimitStore?.delete(failedKey);
    req.app.locals.rateLimitStore?.delete(lockoutKey);

    await User.updateLastLogin(user.id);

    const hotelQuery = `
      SELECT
        id,
        hotel_name,
        hotel_phone,
        hotel_address,
        city,
        country,
        timezone,
        currency,
        tax_rate,
        service_charge,
        subscription_status,
        subscription_plan_id,
        subscription_end_date,
        is_active,
        is_verified,
        created_at,
        updated_at
      FROM hotels
      WHERE id = $1
      LIMIT 1
    `;

    const tablesQuery = `
      SELECT
        id,
        hotel_id,
        table_number,
        table_name,
        capacity,
        floor_number,
        section,
        status,
        qr_code_url,
        created_at,
        updated_at
      FROM hotel_tables
      WHERE hotel_id = $1
      ORDER BY floor_number ASC, table_number ASC
    `;

    const menuCategoriesQuery = `
      SELECT
        id,
        hotel_id,
        name,
        description,
        display_order,
        image_url,
        is_active,
        created_at
      FROM menu_categories
      WHERE hotel_id = $1
      ORDER BY display_order ASC, name ASC
    `;

    const menuItemsQuery = `
      SELECT
        mi.id,
        mi.hotel_id,
        mi.category_id,
        mc.name AS category_name,
        mi.item_code,
        mi.name,
        mi.description,
        mi.price,
        mi.cost_price,
        mi.tax_rate,
        mi.preparation_time,
        mi.is_available,
        mi.is_popular,
        mi.is_vegetarian,
        mi.dietary_info,
        mi.image_url,
        mi.created_at,
        mi.updated_at
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE mi.hotel_id = $1
      ORDER BY mc.display_order ASC NULLS LAST, mi.name ASC
    `;

    const [hotelResult, tablesResult, categoriesResult, itemsResult] =
      await Promise.all([
        db.query(hotelQuery, [user.hotel_id]),
        db.query(tablesQuery, [user.hotel_id]),
        db.query(menuCategoriesQuery, [user.hotel_id]),
        db.query(menuItemsQuery, [user.hotel_id]),
      ]);

    const hotel = hotelResult.rows[0] || null;

    const accessExpiresIn = "1d";
    const refreshExpiresInDays = rememberMe ? 30 : 7;

    const accessToken = jwt.sign(
      {
        session_id: sessionId,
        role: "staff",
        user_id: user.id,
        staff_id: user.id,
        hotel_id: user.hotel_id,
        staff_code: user.staff_code,
        staff_role: user.role,
        type: "access",
      },
      process.env.JWT_SECRET,
      { expiresIn: accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      {
        session_id: sessionId,
        role: "staff",
        user_id: user.id,
        staff_id: user.id,
        hotel_id: user.hotel_id,
        type: "refresh",
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: `${refreshExpiresInDays}d` }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };

    res.cookie("staff_access", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("staff_refresh", refreshToken, {
      ...cookieOptions,
      maxAge: refreshExpiresInDays * 24 * 60 * 60 * 1000,
    });

    res.cookie("staff_session", sessionId, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: refreshExpiresInDays * 24 * 60 * 60 * 1000,
    });

    await ActivityLog.logActivity({
      session_id: sessionId,
      hotel_id: user.hotel_id,
      user_id: user.id,
      user_type: "staff",
      action: "STAFF_LOGIN_SUCCESS",
      details: JSON.stringify({
        email: cleanEmail,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        rememberMe,
        duration: Date.now() - startTime,
      }),
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    logger?.info?.("Staff login successful", {
      sessionId,
      userId: user.id,
      hotel_id: user.hotel_id,
      role: user.role,
      duration: Date.now() - startTime,
    });

    return res.json({
      success: true,
      message: "Login successful",
      staff: {
        id: user.id,
        hotel_id: user.hotel_id,
        hotel_name: hotel?.hotel_name || null,
        staff_code: user.staff_code,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
        email: user.email,
        profile_image: user.profile_image || null,
        is_active: user.is_active,
        is_email_verified: user.is_email_verified,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      hotel: hotel
        ? {
            id: hotel.id,
            hotel_name: hotel.hotel_name,
            hotel_phone: hotel.hotel_phone,
            hotel_address: hotel.hotel_address,
            city: hotel.city,
            country: hotel.country,
            timezone: hotel.timezone,
            currency: hotel.currency,
            tax_rate: hotel.tax_rate,
            service_charge: hotel.service_charge,
            subscription_status: hotel.subscription_status,
            subscription_plan_id: hotel.subscription_plan_id,
            subscription_end_date: hotel.subscription_end_date,
            is_active: hotel.is_active,
            is_verified: hotel.is_verified,
            created_at: hotel.created_at,
            updated_at: hotel.updated_at,
          }
        : null,
      tables: tablesResult.rows,
      menu_categories: categoriesResult.rows,
      menu_items: itemsResult.rows,
      session: {
        id: sessionId,
        expires_in: accessExpiresIn,
        refresh_expires_in_days: refreshExpiresInDays,
        is_remembered: rememberMe,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    logger?.error?.("Staff login error", {
      sessionId,
      error: error.message,
      stack: error.stack,
    });

    try {
      await ActivityLog.logActivity({
        session_id: sessionId,
        hotel_id: req.body?.hotel_id || null,
        user_id: null,
        user_type: "guest",
        action: "STAFF_LOGIN_ERROR",
        details: JSON.stringify({
          error: error.message,
          stack: error.stack?.split("\n")[0],
        }),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
    } catch (logErr) {
      console.warn("Activity log error:", logErr.message);
    }

    next(error);
  }
};

/* =========================
   LOGOUT STAFF
========================= */
exports.logoutStaff = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };

    res.clearCookie("staff_token", cookieOptions);
    res.clearCookie("staff_access", cookieOptions);
    res.clearCookie("staff_refresh", cookieOptions);

    res.clearCookie("staff_session", {
      ...cookieOptions,
      httpOnly: false,
    });

    if (req.staff || req.staffId || req.user) {
      try {
        await ActivityLog.logActivity({
          hotel_id: req.hotelId || req.staff?.hotel_id || req.user?.hotel_id || null,
          user_id: req.staffId || req.staff?.id || req.user?.id || null,
          user_type: "staff",
          action: "STAFF_LOGOUT",
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
        });
      } catch (logError) {
        console.warn("Staff logout log failed:", logError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Staff logged out successfully",
    });
  } catch (error) {
    console.error("Staff logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/* =========================
   GET CURRENT STAFF
========================= */
exports.getCurrentStaff = async (req, res, next) => {
  try {
    const staffId = req.staff?.id || req.staffId || req.user?.id;
    const hotelId = req.hotelId || req.staff?.hotel_id || req.user?.hotel_id;

    if (!staffId) {
      return errorResponse(res, 401, "Not authorized");
    }

    const isActiveResult = await db.query(
      `
      SELECT is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [staffId]
    );

    if (
      isActiveResult.rows.length === 0 ||
      isActiveResult.rows[0].is_active === false
    ) {
      return errorResponse(res, 403, "Account is deactivated");
    }

    const staffQuery = `
      SELECT
        u.id,
        u.hotel_id,
        u.staff_code,
        u.full_name,
        u.role,
        u.phone_number,
        u.email,
        u.profile_image,
        u.is_active,
        u.is_email_verified,
        u.last_login,
        u.created_at,
        u.updated_at,
        h.hotel_name
      FROM users u
      JOIN hotels h ON h.id = u.hotel_id
      WHERE u.id = $1
        AND u.hotel_id = $2
        AND u.is_active = true
      LIMIT 1
    `;

    const tablesQuery = `
      SELECT
        id,
        hotel_id,
        table_number,
        table_name,
        capacity,
        floor_number,
        section,
        status,
        qr_code_url,
        created_at,
        updated_at
      FROM hotel_tables
      WHERE hotel_id = $1
      ORDER BY floor_number ASC, table_number ASC
    `;

    const menuCategoriesQuery = `
      SELECT
        id,
        hotel_id,
        name,
        description,
        display_order,
        image_url,
        is_active,
        created_at
      FROM menu_categories
      WHERE hotel_id = $1
      ORDER BY display_order ASC, name ASC
    `;

    const menuItemsQuery = `
      SELECT
        mi.id,
        mi.hotel_id,
        mi.category_id,
        mc.name AS category_name,
        mi.item_code,
        mi.name,
        mi.description,
        mi.price,
        mi.cost_price,
        mi.tax_rate,
        mi.preparation_time,
        mi.is_available,
        mi.is_popular,
        mi.is_vegetarian,
        mi.dietary_info,
        mi.image_url,
        mi.created_at,
        mi.updated_at
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE mi.hotel_id = $1
      ORDER BY mc.display_order ASC NULLS LAST, mi.name ASC
    `;

    const [staffResult, tablesResult, categoriesResult, itemsResult] =
      await Promise.all([
        db.query(staffQuery, [staffId, hotelId]),
        db.query(tablesQuery, [hotelId]),
        db.query(menuCategoriesQuery, [hotelId]),
        db.query(menuItemsQuery, [hotelId]),
      ]);

    if (staffResult.rows.length === 0) {
      return errorResponse(res, 404, "Staff account not found");
    }

    const staff = staffResult.rows[0];

    return res.status(200).json({
      success: true,
      staff: {
        id: staff.id,
        hotel_id: staff.hotel_id,
        hotel_name: staff.hotel_name,
        staff_code: staff.staff_code,
        full_name: staff.full_name,
        role: staff.role,
        phone_number: staff.phone_number,
        email: staff.email,
        profile_image: staff.profile_image,
        is_active: staff.is_active,
        is_email_verified: staff.is_email_verified,
        last_login: staff.last_login,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
      },
      tables: tablesResult.rows,
      menu_categories: categoriesResult.rows,
      menu_items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get current staff error:", error);
    next(error);
  }
};

/* =========================
   REFRESH STAFF TOKEN
========================= */
exports.refreshStaffToken = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.staff_refresh ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!refreshToken) {
      return errorResponse(res, 401, "Refresh token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      return errorResponse(res, 401, "Invalid or expired refresh token");
    }

    if (decoded.role !== "staff" || decoded.type !== "refresh") {
      return errorResponse(res, 401, "Invalid refresh token");
    }

    const user = await User.findById(decoded.user_id || decoded.staff_id);

    if (!user || user.hotel_id !== decoded.hotel_id || !user.is_active) {
      return errorResponse(res, 401, "Staff account not found or inactive");
    }

    const newAccessToken = jwt.sign(
      {
        session_id: decoded.session_id,
        role: "staff",
        user_id: user.id,
        staff_id: user.id,
        hotel_id: user.hotel_id,
        staff_code: user.staff_code,
        staff_role: user.role,
        type: "access",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("staff_access", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Staff token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh staff token error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};

/* =========================
   TOGGLE STAFF STATUS
========================= */
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotelId = req.hotelId;

    if (!hotelId) {
      return errorResponse(res, 401, "Unauthorized");
    }

    if (!id) {
      return errorResponse(res, 400, "Staff ID is required");
    }

    const existingQuery = `
      SELECT id, full_name, staff_code, is_active
      FROM users
      WHERE id = $1 AND hotel_id = $2
      LIMIT 1
    `;

    const existingResult = await db.query(existingQuery, [id, hotelId]);

    if (existingResult.rows.length === 0) {
      return errorResponse(res, 404, "Staff member not found");
    }

    const user = existingResult.rows[0];
    const nextStatus = !user.is_active;

    const updateQuery = `
      UPDATE users
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND hotel_id = $3
      RETURNING
        id,
        hotel_id,
        staff_code,
        full_name,
        role,
        phone_number,
        email,
        profile_image,
        is_active,
        is_email_verified,
        last_login,
        created_at,
        updated_at
    `;

    const result = await db.query(updateQuery, [nextStatus, id, hotelId]);

    await db.query(
      `
      INSERT INTO activity_logs (
        user_id,
        user_type,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW())
      `,
      [
        req.user?.id || req.hotelId,
        "hotel_admin",
        nextStatus ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF",
        "users",
        id,
        JSON.stringify({
          staff_id: id,
          staff_code: user.staff_code,
          full_name: user.full_name,
          previous_status: user.is_active,
          new_status: nextStatus,
        }),
        req.ip,
        req.headers["user-agent"] || null,
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Staff member ${nextStatus ? "activated" : "deactivated"} successfully`,
      staff: result.rows[0],
    });
  } catch (error) {
    console.error("Toggle staff status error:", error);
    next(error);
  }
};
exports.changeStaffPassword = async (req, res, next) => {
  try {
    const staffId = req.staff?.id || req.staffId || req.user?.id;

    const {
      current_password,
      new_password,
      confirm_password,
    } = req.body;

    if (!staffId) {
      return errorResponse(res, 401, "Unauthorized");
    }

    if (!current_password || !new_password || !confirm_password) {
      return errorResponse(
        res,
        400,
        "Current password, new password and confirm password are required"
      );
    }

    if (new_password !== confirm_password) {
      return errorResponse(
        res,
        400,
        "New password and confirm password do not match"
      );
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

    if (!passwordRegex.test(String(new_password))) {
      return errorResponse(
        res,
        400,
        "Password must be at least 8 chars and include uppercase, lowercase, number, and symbol."
      );
    }

    const user = await User.findById(staffId);

    if (!user) {
      return errorResponse(res, 404, "Staff not found");
    }

    const isMatch = await bcrypt.compare(
      current_password,
      user.password_hash
    );

    if (!isMatch) {
      return errorResponse(res, 400, "Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(
      new_password,
      user.password_hash
    );

    if (isSamePassword) {
      return errorResponse(
        res,
        400,
        "New password cannot be same as current password"
      );
    }

    const password_hash = await bcrypt.hash(new_password, 10);

    await db.query(
      `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [password_hash, staffId]
    );

    await ActivityLog.logActivity({
      hotel_id: user.hotel_id,
      user_id: user.id,
      user_type: "staff",
      action: "CHANGE_PASSWORD",
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    next(error);
  }
};