const BaseModel = require('./BaseModel.js');
const db = require('../config/database.js');
const bcrypt = require('bcryptjs');

class MainAdmin extends BaseModel {
  constructor() {
    super('main_admins');
  }

  /* ======================
     FAST EMAIL LOOKUP
     Main admin login table
  ====================== */
  async findByEmail(email) {
    const query = `
      SELECT 
        id, 
        email, 
        password_hash, 
        full_name, 
        is_active
      FROM main_admins
      WHERE email = $1
      LIMIT 1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  /* ======================
     CREATE MAIN ADMIN
  ====================== */
  async createAdmin(adminData) {
    return await this.create(adminData);
  }

  /* ======================
     PASSWORD VERIFY
  ====================== */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  /* ======================
     DASHBOARD STATS
  ====================== */
  async getAllHotelsStats() {
    const query = `
      SELECT 
        COUNT(*)::int AS total_hotels,

        COUNT(*) FILTER (
          WHERE h.subscription_status = 'active'
        )::int AS active_hotels,

        COUNT(*) FILTER (
          WHERE h.subscription_status = 'suspended'
        )::int AS suspended_hotels,

        COUNT(*) FILTER (
          WHERE h.subscription_status = 'cancelled'
        )::int AS cancelled_hotels,

        COUNT(*) FILTER (
          WHERE h.subscription_status = 'active'
        )::int AS monthly_recurring_hotels,

        COALESCE(
          SUM(
            CASE 
              WHEN h.subscription_status = 'active'
              THEN COALESCE(sp.price_per_month, sp.price_per_year / 12, 0)
              ELSE 0
            END
          ), 
          0
        )::int AS estimated_monthly_revenue

      FROM hotels h
      LEFT JOIN subscription_plans sp 
        ON h.subscription_plan_id = sp.id
      WHERE h.is_active = true
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /* ======================
     RECENT ACTIVITY
     Updated: staff -> users
     Updated: hotel_admin_email -> users.email
  ====================== */
  async getRecentActivity(limit = 50) {
    const query = `
      SELECT 
        al.id,
        al.action,
        al.user_type,
        al.created_at,
        al.details,

        CASE 
          WHEN al.user_type = 'main_admin' THEN ma.email

          WHEN al.user_type = 'hotel_admin' THEN admin_user.email

          WHEN al.user_type = 'staff' THEN staff_user.email

          WHEN al.user_type = 'user' THEN normal_user.email

          WHEN al.user_type = 'hotel' THEN h.hotel_name

          ELSE NULL
        END AS user_email,

        CASE 
          WHEN al.user_type = 'main_admin' THEN ma.full_name

          WHEN al.user_type = 'hotel_admin' THEN admin_user.full_name

          WHEN al.user_type = 'staff' THEN staff_user.full_name

          WHEN al.user_type = 'user' THEN normal_user.full_name

          WHEN al.user_type = 'hotel' THEN h.hotel_name

          ELSE NULL
        END AS user_name,

        COALESCE(
          h.hotel_name,
          admin_hotel.hotel_name,
          staff_hotel.hotel_name,
          normal_user_hotel.hotel_name
        ) AS hotel_name

      FROM activity_logs al

      LEFT JOIN main_admins ma 
        ON al.user_id = ma.id 
        AND al.user_type = 'main_admin'

      LEFT JOIN hotels h 
        ON al.user_id = h.id 
        AND al.user_type = 'hotel'

      LEFT JOIN users admin_user 
        ON al.user_id = admin_user.id 
        AND al.user_type = 'hotel_admin'

      LEFT JOIN hotels admin_hotel
        ON admin_user.hotel_id = admin_hotel.id

      LEFT JOIN users staff_user 
        ON al.user_id = staff_user.id 
        AND al.user_type = 'staff'

      LEFT JOIN hotels staff_hotel
        ON staff_user.hotel_id = staff_hotel.id

      LEFT JOIN users normal_user
        ON al.user_id = normal_user.id
        AND al.user_type = 'user'

      LEFT JOIN hotels normal_user_hotel
        ON normal_user.hotel_id = normal_user_hotel.id

      ORDER BY al.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /* ======================
     SUBSCRIPTION ANALYTICS
  ====================== */
  async getSubscriptionAnalytics(timeframe = 'month') {
    const intervals = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
      year: '365 days',
    };

    const interval = intervals[timeframe] || intervals.month;

    const query = `
      SELECT 
        DATE(h.created_at) AS date,

        COUNT(*)::int AS new_hotels,

        COUNT(*) FILTER (
          WHERE h.subscription_status = 'active'
        )::int AS activated_hotels,

        (
          SELECT COUNT(*)::int
          FROM hotels h2
          WHERE h2.subscription_status = 'active'
            AND h2.is_active = true
        ) AS total_active

      FROM hotels h
      WHERE h.created_at >= NOW() - $1::interval
        AND h.is_active = true
      GROUP BY DATE(h.created_at)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [interval]);
    return result.rows;
  }
}

module.exports = new MainAdmin();
