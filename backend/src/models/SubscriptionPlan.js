const BaseModel = require('./BaseModel');
const db = require('../config/database');

class SubscriptionPlan extends BaseModel {
  constructor() {
    super('subscription_plans');
  }

  async getActivePlans() {
    const query = 'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_per_year';
    const result = await db.query(query);
    return result.rows;
  }

  async getPlanFeatures(planId) {
    const query = 'SELECT features FROM subscription_plans WHERE id = $1';
    const result = await db.query(query, [planId]);
    return result.rows[0]?.features || {};
  }

  async createPlan(planData, createdBy) {
    planData.created_by = createdBy;
    planData.features = JSON.stringify(planData.features || {});
    return await this.create(planData);
  }

  async updatePlan(planId, updateData, updatedBy) {
    if (updateData.features) {
      updateData.features = JSON.stringify(updateData.features);
    }
    updateData.updated_by = updatedBy;
    return await this.update(planId, updateData);
  }

  async canHotelAddStaff(hotelId) {
    const query = `
      SELECT 
        sp.max_staff,
        (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id AND s.is_active = true) as current_staff
      FROM hotels h
      JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE h.id = $1
    `;
    
    const result = await db.query(query, [hotelId]);
    if (result.rows.length === 0) return false;
    
    const { max_staff, current_staff } = result.rows[0];
    return current_staff < max_staff;
  }

  async canHotelAddTables(hotelId) {
    const query = `
      SELECT 
        sp.max_tables,
        (SELECT COUNT(*) FROM hotel_tables ht WHERE ht.hotel_id = h.id) as current_tables
      FROM hotels h
      JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE h.id = $1
    `;
    
    const result = await db.query(query, [hotelId]);
    if (result.rows.length === 0) return false;
    
    const { max_tables, current_tables } = result.rows[0];
    return current_tables < max_tables;
  }

  async canHotelAddMenuItems(hotelId) {
    const query = `
      SELECT 
        sp.max_menu_items,
        (SELECT COUNT(*) FROM menu_items mi WHERE mi.hotel_id = h.id) as current_menu_items
      FROM hotels h
      JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
      WHERE h.id = $1
    `;
    
    const result = await db.query(query, [hotelId]);
    if (result.rows.length === 0) return false;
    
    const { max_menu_items, current_menu_items } = result.rows[0];
    return current_menu_items < max_menu_items;
  }
}

module.exports = new SubscriptionPlan();