const BaseModel = require('./BaseModel');
const db = require('../config/database');

class HotelAdmin extends BaseModel {
  constructor() {
    super('hotel_admins');
  }

  async isUserHotelAdmin(userId, hotelId) {
    const query = 'SELECT * FROM hotel_admins WHERE user_id = $1 AND hotel_id = $2';
    const result = await db.query(query, [userId, hotelId]);
    return result.rows.length > 0;
  }

  async getUserHotels(userId) {
    const query = `
      SELECT 
        ha.*,
        h.hotel_name,
        h.hotel_slug,
        h.subscription_status,
        h.is_active as hotel_active,
        sp.plan_name,
        sp.price_per_year
      FROM hotel_admins ha
      JOIN hotels h ON ha.hotel_id = h.id
      LEFT JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE ha.user_id = $1
      ORDER BY ha.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async addAdminToHotel(hotelId, userId, permissions = {}) {
    // Check if already admin
    const existing = await this.isUserHotelAdmin(userId, hotelId);
    if (existing) {
      throw new Error('User is already an admin for this hotel');
    }

    const adminData = {
      hotel_id: hotelId,
      user_id: userId,
      is_primary_admin: false,
      permissions: JSON.stringify({
        manage_staff: false,
        manage_menu: false,
        view_reports: false,
        manage_subscription: false,
        manage_settings: false,
        ...permissions
      })
    };

    return await this.create(adminData);
  }

  async updateAdminPermissions(adminId, permissions) {
    return await this.update(adminId, {
      permissions: JSON.stringify(permissions)
    });
  }

  async getHotelAdmins(hotelId) {
    const query = `
      SELECT 
        ha.*,
        ru.email,
        ru.full_name,
        ru.phone_number
      FROM hotel_admins ha
      JOIN registered_users ru ON ha.user_id = ru.id
      WHERE ha.hotel_id = $1
      ORDER BY ha.is_primary_admin DESC, ha.created_at ASC
    `;
    
    const result = await db.query(query, [hotelId]);
    return result.rows;
  }

  async removeAdminFromHotel(hotelId, userId) {
    // Cannot remove primary admin
    const query = 'DELETE FROM hotel_admins WHERE hotel_id = $1 AND user_id = $2 AND is_primary_admin = false';
    const result = await db.query(query, [hotelId, userId]);
    return result.rowCount > 0;
  }

  async transferPrimaryAdmin(hotelId, newAdminId, currentAdminId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Remove primary status from current admin
      await client.query(
        'UPDATE hotel_admins SET is_primary_admin = false WHERE hotel_id = $1 AND user_id = $2',
        [hotelId, currentAdminId]
      );
      
      // Set new primary admin
      await client.query(
        'UPDATE hotel_admins SET is_primary_admin = true WHERE hotel_id = $1 AND user_id = $2',
        [hotelId, newAdminId]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new HotelAdmin();