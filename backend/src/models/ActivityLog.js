const BaseModel = require('./BaseModel.js');
const db = require('../config/database.js');

class ActivityLog extends BaseModel {
  constructor() {
    super('activity_logs');
  }

  async logActivity(data) {
    return await this.create(data);
  }

  async getHotelActivity(hotelId, limit = 100) {
    const query = `
      SELECT al.*,
        CASE 
          WHEN al.user_type = 'hotel_admin' THEN h.admin_email
          WHEN al.user_type = 'staff' THEN s.email
          ELSE 'System'
        END as user_email,
        CASE 
          WHEN al.user_type = 'staff' THEN s.full_name
          WHEN al.user_type = 'hotel_admin' THEN h.hotel_name
          ELSE 'System'
        END as user_name
      FROM activity_logs al
      LEFT JOIN hotels h ON al.user_id = h.id AND al.user_type IN ('hotel_admin', 'hotel')
      LEFT JOIN staff s ON al.user_id = s.id AND al.user_type = 'staff'
      WHERE al.hotel_id = $1 OR (al.user_type = 'hotel_admin' AND al.user_id = $1)
      ORDER BY al.created_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [hotelId, limit]);
    return result.rows;
  }

  async getRecentActivityByUser(userId, userType, limit = 50) {
    const query = `
      SELECT * FROM activity_logs 
      WHERE user_id = $1 AND user_type = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    
    const result = await db.query(query, [userId, userType, limit]);
    return result.rows;
  }
}

module.exports = new ActivityLog();