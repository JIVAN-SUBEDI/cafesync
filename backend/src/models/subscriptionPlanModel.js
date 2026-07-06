// src/models/SubscriptionPlanModel.js
const BaseModel = require("./BaseModel");

class SubscriptionPlanModel extends BaseModel {
  constructor() {
    super("subscription_plans");
  }

  // Public: show only active plans by default, sorted nicely
  async listPublic({ activeOnly = true, limit = 100, offset = 0 } = {}) {
    const conditions = activeOnly ? { is_active: true } : {};
    // BaseModel orders by id desc; for plans you usually want display_order asc
    // So we override with a custom query:
    const db = require("../config/database.js");

    const where = activeOnly ? "WHERE is_active = true" : "";
    const query = `
      SELECT *
      FROM subscription_plans
      ${where}
      ORDER BY display_order ASC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Admin: list all (active + inactive), ordered
  async listAdmin({ limit = 200, offset = 0 } = {}) {
    const db = require("../config/database.js");
    const query = `
      SELECT *
      FROM subscription_plans
      ORDER BY display_order ASC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = new SubscriptionPlanModel();
