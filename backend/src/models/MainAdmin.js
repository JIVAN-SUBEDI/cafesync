
const BaseModel = require('./BaseModel.js');
const db = require('../config/database.js');
const bcrypt = require('bcryptjs');

class MainAdmin extends BaseModel {
  constructor() {
    super('main_admins'); // ✅ FIXED TABLE NAME
  }

  /* ======================
     FAST EMAIL LOOKUP
     Uses index idx_main_admins_email
  ====================== */
  async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, full_name, is_active
      FROM main_admins
      WHERE email = $1
      LIMIT 1
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  /* ======================
     CREATE ADMIN
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
     Optimized aggregations
  ====================== */
  async getAllHotelsStats() {
    const query = `
      SELECT 
        COUNT(*)::int as total_hotels,
        COUNT(*) FILTER (WHERE h.subscription_status = 'active')::int as active_hotels,
        COUNT(*) FILTER (WHERE h.subscription_status = 'suspended')::int as suspended_hotels,
        COUNT(*) FILTER (WHERE h.subscription_status = 'cancelled')::int as cancelled_hotels,
        COUNT(*) FILTER (WHERE h.subscription_status = 'active')::int as monthly_recurring_hotels,
        COALESCE(SUM(sp.price_per_year), 0)::int as estimated_monthly_revenue
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
     Indexed + fast join
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
          WHEN al.user_type = 'hotel_admin' THEN h.hotel_admin_email
          WHEN al.user_type = 'staff' THEN s.email
          WHEN al.user_type = 'hotel' THEN h.hotel_name
        END as user_email,
        h.hotel_name
      FROM activity_logs al
      LEFT JOIN main_admins ma 
        ON al.user_id = ma.id AND al.user_type = 'main_admin'
      LEFT JOIN hotels h 
        ON al.user_id = h.id AND al.user_type IN ('hotel_admin', 'hotel')
      LEFT JOIN staff s 
        ON al.user_id = s.id AND al.user_type = 'staff'
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /* ======================
     SUBSCRIPTION ANALYTICS
     Optimized grouping
  ====================== */
  async getSubscriptionAnalytics(timeframe = 'month') {
    const intervals = {
      day: '1 day',
      week: '7 day',
      month: '30 day',
      year: '365 day'
    };

    const interval = intervals[timeframe] || '30 day';
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as new_hotels,
        COUNT(*) FILTER (WHERE subscription_status = 'active')::int as activated_hotels,
        COUNT(*) FILTER (WHERE subscription_status = 'active')::int as total_active
      FROM hotels
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new MainAdmin();
