const db = require("../config/database.js");

const dashboardCache = new Map();
const CACHE_TTL = 60000;

const clearOldCache = () => {
  const now = Date.now();
  for (const [key, value] of dashboardCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      dashboardCache.delete(key);
    }
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const today = new Date().toISOString().split("T")[0];

    const cacheKey = `dashboard_${hotelId}_${today}`;
    const cachedData = dashboardCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return res.json(cachedData.data);
    }

    /* =========================
       MAIN DASHBOARD QUERY
    ========================= */

    const dashboardData = await db.query(
      `
      WITH 
hotel_info AS (
  SELECT 
    id,
    hotel_name,
    hotel_slug,
    hotel_img,
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
),

      today_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(created_at) = $2 THEN total_amount END), 0) as today_revenue,
          COUNT(CASE WHEN DATE(created_at) = $2 THEN id END) as today_orders,
          COUNT(CASE WHEN DATE(created_at) = $2 AND status NOT IN ('completed','cancelled') THEN id END) as active_orders
        FROM orders
        WHERE hotel_id = $1
      ),

      table_stats AS (
        SELECT 
          COUNT(*) as total_tables,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables
        FROM hotel_tables
        WHERE hotel_id = $1
      ),

      staff_stats AS (
        SELECT 
          COUNT(*) as total_staff,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff
        FROM users
        WHERE hotel_id = $1 
          AND role != 'hotel_admin'
      )

      SELECT 
        hi.*,
        ts.today_revenue,
        ts.today_orders,
        ts.active_orders,
        CASE 
          WHEN t.total_tables > 0 
          THEN ROUND((t.occupied_tables * 100.0 / t.total_tables), 0)
          ELSE 0 
        END as table_occupancy,
        CONCAT(s.active_staff, '/', s.total_staff) as staff_active
      FROM hotel_info hi
      CROSS JOIN today_stats ts
      CROSS JOIN table_stats t
      CROSS JOIN staff_stats s
      `,
      [hotelId, today]
    );

    /* =========================
       PARALLEL DATA
    ========================= */

    const [
      recentOrdersResult,
      staffResult,
      tablesResult,
    ] = await Promise.all([

      // ✅ ORDERS (FIXED → users)
      db.query(
        `
        SELECT 
          o.id,
          o.order_number,
          t.table_number,
          o.customer_name,
          o.total_amount,
          o.status,
          o.created_at,
          u.full_name as waiter_name
        FROM orders o
        LEFT JOIN hotel_tables t ON o.table_id = t.id
        LEFT JOIN users u ON o.waiter_id = u.id
        WHERE o.hotel_id = $1
        ORDER BY o.created_at DESC
        LIMIT 10
        `,
        [hotelId]
      ),

      // ✅ STAFF (NOW USERS)
      db.query(
        `
        SELECT 
          id,
          full_name,
          role,
          phone_number,
          email,
          is_active
        FROM users
        WHERE hotel_id = $1 
          AND role != 'hotel_admin'
        ORDER BY full_name
        `,
        [hotelId]
      ),

      // TABLES
      db.query(
        `
        SELECT 
          id,
          table_number,
          table_name,
          capacity,
          status
        FROM hotel_tables
        WHERE hotel_id = $1
        `,
        [hotelId]
      ),
    ]);

    /* =========================
       FORMAT DATA
    ========================= */

    const stats = dashboardData.rows[0] || {};

    const orders = recentOrdersResult.rows.map(o => ({
      id: o.id,
      number: o.order_number,
      table: o.table_number,
      customer: o.customer_name,
      amount: parseFloat(o.total_amount),
      status: o.status,
      waiter: o.waiter_name,
      created_at: o.created_at,
    }));

    const staff = staffResult.rows.map(s => ({
      id: s.id,
      name: s.full_name,
      role: s.role,
      phone: s.phone_number,
      email: s.email,
      active: s.is_active,
    }));

    const tables = tablesResult.rows;

    const response = {
      success: true,
      data: {
          hotel: {
            id: stats.id,
            hotel_name: stats.hotel_name,
            hotel_slug: stats.hotel_slug,
            hotel_img: stats.hotel_img,
            hotel_phone: stats.hotel_phone,
            hotel_address: stats.hotel_address,
            city: stats.city,
            country: stats.country,
            timezone: stats.timezone,
            currency: stats.currency,
            tax_rate: parseFloat(stats.tax_rate),
            service_charge: parseFloat(stats.service_charge),
            subscription_status: stats.subscription_status,
            subscription_plan_id: stats.subscription_plan_id,
            subscription_end_date: stats.subscription_end_date,
            is_active: stats.is_active,
            is_verified: stats.is_verified,
            created_at: stats.created_at,
            updated_at: stats.updated_at,
          },
        stats: {
          revenue: parseFloat(stats.today_revenue) || 0,
          orders: parseInt(stats.today_orders) || 0,
          active_orders: parseInt(stats.active_orders) || 0,
          occupancy: parseInt(stats.table_occupancy) || 0,
          staff: stats.staff_active || "0/0",
        },
        recent_orders: orders,
        staff,
        tables,
      },
    };

    clearOldCache();

    dashboardCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    return res.json(response);

  } catch (error) {
    console.error("Dashboard error:", error);
    next(error);
  }
};