
const subscriptionPlanModel = require("../models/subscriptionPlanModel.js");

const pick = (obj, allowed) => {
  const out = {};
  for (const k of allowed) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
};

// ===== PUBLIC (no auth) =====

/**
 * List public subscription plans
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - Filter by active status
 * @param {number} options.limit - Items per page
 * @param {number} options.offset - Pagination offset
 */
exports.listPublicPlans = async ({ activeOnly = true, limit = 100, offset = 0 }) => {
  try {
    const plans = await subscriptionPlanModel.listPublic({ 
      activeOnly, 
      limit, 
      offset 
    });
    return plans;
  } catch (err) {
    throw err;
  }
};

// GET /api/subscription-plans (original handler for backward compatibility)
exports.listPublicPlansHandler = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== "false";
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 200);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

    const plans = await subscriptionPlanModel.listPublic({ 
      activeOnly, 
      limit, 
      offset 
    });
    
    return res.json({ 
      success: true, 
      data: {
        plans,
        pagination: {
          limit,
          offset,
          total: plans.length // You might want to add a count query for accurate total
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/subscription-plans/:id (public can view)
exports.getPublicPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan ID format" 
      });
    }
    
    const plan = await subscriptionPlanModel.findById(id);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }

    // Optional: Hide inactive plans from public
    // if (!plan.is_active) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     message: "Plan not found" 
    //   });
    // }

    return res.json({ 
      success: true, 
      data: { plan }
    });
  } catch (err) {
    next(err);
  }
};

// ===== ADMIN (protected by protectAdmin middleware) =====

// POST /api/subscription-plans/create (admin)
exports.createPlan = async (req, res, next) => {
  try {
    // Data is already validated by Zod middleware
    const data = pick(req.body, [
      "plan_name",
      "plan_code",
      "description",
      "price_per_year",
      "price_per_month",
      "max_staff",
      "max_tables",
      "max_menu_items",
      "features",
      "display_order",
      "is_active",
    ]);

    // Set defaults for optional fields
    if (data.features === undefined) data.features = {};
    if (data.display_order === undefined) data.display_order = 0;
    if (data.is_active === undefined) data.is_active = true;

    const created = await subscriptionPlanModel.create(data);
    
    return res.status(201).json({ 
      success: true, 
      message: "Subscription plan created successfully",
      data: { id: created.id }
    });
  } catch (err) {
    // plan_code unique violation in Postgres
    if (err.code === "23505") {
      return res.status(409).json({ 
        success: false, 
        message: "Plan code already exists. Please use a unique plan code." 
      });
    }
    next(err);
  }
};

// PUT /api/subscription-plans/:id (admin)
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan ID format" 
      });
    }
    
    // Data is already validated by Zod middleware
    const patch = pick(req.body, [
      "plan_name",
      "plan_code",
      "description",
      "price_per_year",
      "price_per_month",
      "max_staff",
      "max_tables",
      "max_menu_items",
      "features",
      "display_order",
      "is_active",
    ]);

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No fields to update" 
      });
    }

    // Check if plan exists
    const existing = await subscriptionPlanModel.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }

    const updated = await subscriptionPlanModel.update(id, patch);
    
    return res.json({ 
      success: true, 
      message: "Subscription plan updated successfully",
      data: { id: updated.id }
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ 
        success: false, 
        message: "Plan code already exists. Please use a unique plan code." 
      });
    }
    next(err);
  }
};

// DELETE /api/subscription-plans/:id (admin) - Hard delete
exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan ID format" 
      });
    }
    
    // Check if plan exists
    const existing = await subscriptionPlanModel.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }
    
    // Check if plan has active subscriptions before deleting
    // This would require a method to check if any hotels are using this plan
    // const hasActiveSubscriptions = await subscriptionPlanModel.hasActiveSubscriptions(id);
    // if (hasActiveSubscriptions) {
    //   return res.status(409).json({
    //     success: false,
    //     message: "Cannot delete plan with active subscriptions. Consider disabling it instead."
    //   });
    // }

    const deleted = await subscriptionPlanModel.delete(id);
    
    return res.json({ 
      success: true, 
      message: "Subscription plan deleted successfully",
      data: { id: deleted.id }
    });
  } catch (err) {
    // Handle foreign key constraints
    if (err.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete plan because it is referenced by existing hotels. Consider disabling it instead."
      });
    }
    next(err);
  }
};

// PATCH /api/subscription-plans/:id/disable (admin) - Soft delete (recommended)
exports.disablePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan ID format" 
      });
    }
    
    // Check if plan exists
    const existing = await subscriptionPlanModel.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }
    
    if (!existing.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: "Plan is already disabled" 
      });
    }

    const updated = await subscriptionPlanModel.update(id, { is_active: false });
    
    return res.json({ 
      success: true, 
      message: "Subscription plan disabled successfully",
      data: { id: updated.id }
    });
  } catch (err) {
    next(err);
  }
};

// Optional: Enable plan
exports.enablePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan ID format" 
      });
    }
    
    const existing = await subscriptionPlanModel.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }
    
    if (existing.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: "Plan is already active" 
      });
    }

    const updated = await subscriptionPlanModel.update(id, { is_active: true });
    
    return res.json({ 
      success: true, 
      message: "Subscription plan enabled successfully",
      data: { id: updated.id }
    });
  } catch (err) {
    next(err);
  }
};