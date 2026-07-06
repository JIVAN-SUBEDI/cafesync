const BaseModel = require('./BaseModel');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

class Hotel extends BaseModel {
  constructor() {
    super('hotels');
  }

  async findBySlug(slug) {
    const query = 'SELECT * FROM hotels WHERE hotel_slug = $1';
    const result = await db.query(query, [slug]);
    return result.rows[0];
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM hotels WHERE registered_user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async generateUniqueSlug(hotelName) {
    let baseSlug = slugify(hotelName, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.findBySlug(slug);
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      if (counter > 100) {
        slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
        break;
      }
    }
    
    return slug;
  }

  async createHotel(userId, hotelData) {
    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (hotelData.hotel_slug && !slugRegex.test(hotelData.hotel_slug)) {
      throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    // Generate unique slug if not provided
    if (!hotelData.hotel_slug) {
      hotelData.hotel_slug = await this.generateUniqueSlug(hotelData.hotel_name);
    } else {
      // Check if custom slug is available
      const existing = await this.findBySlug(hotelData.hotel_slug);
      if (existing) {
        throw new Error('Slug already taken');
      }
    }

    // Set initial subscription status
    hotelData.registered_user_id = userId;
    hotelData.subscription_status = 'inactive'; // User needs to subscribe first
    hotelData.is_active = true;
    hotelData.settings = JSON.stringify(hotelData.settings || {});

    const hotel = await this.create(hotelData);

    // Create hotel admin entry
    await db.query(`
      INSERT INTO hotel_admins (hotel_id, user_id, is_primary_admin, permissions)
      VALUES ($1, $2, true, $3)
    `, [hotel.id, userId, JSON.stringify({
      manage_staff: true,
      manage_menu: true,
      view_reports: true,
      manage_subscription: true,
      manage_settings: true
    })]);

    return hotel;
  }

  async activateSubscription(hotelId, planId, periodStart, periodEnd) {
    return await this.update(hotelId, {
      subscription_plan_id: planId,
      subscription_status: 'active',
      subscription_start_date: periodStart,
      subscription_end_date: periodEnd,
      current_period_start: periodStart,
      current_period_end: periodEnd
    });
  }

  async updateSubscriptionStatus(hotelId, status) {
    return await this.update(hotelId, { subscription_status: status });
  }

  async checkLimits(hotelId) {
    const query = `
      SELECT 
        h.*,
        sp.max_staff,
        sp.max_tables,
        sp.max_menu_items,
        (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id AND s.is_active = true) as current_staff,
        (SELECT COUNT(*) FROM hotel_tables ht WHERE ht.hotel_id = h.id) as current_tables,
        (SELECT COUNT(*) FROM menu_items mi WHERE mi.hotel_id = h.id) as current_menu_items
      FROM hotels h
      JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE h.id = $1
    `;
    
    const result = await db.query(query, [hotelId]);
    return result.rows[0];
  }

  async getHotelWithPlan(hotelId) {
    const query = `
      SELECT 
        h.*,
        sp.plan_name,
        sp.price_per_year,
        sp.max_staff,
        sp.max_tables,
        sp.max_menu_items,
        sp.features
      FROM hotels h
      LEFT JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE h.id = $1
    `;
    
    const result = await db.query(query, [hotelId]);
    return result.rows[0];
  }
}

module.exports = new Hotel();