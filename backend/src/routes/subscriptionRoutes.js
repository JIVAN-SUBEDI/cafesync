// const router = require("express").Router();
// const controller = require("../controllers/Subscription.js");
// const { protectMainAdmin } = require("../middleware/auth.js");
// const { requireMainAdminPermission } = require("../middleware/requirePermission.jjs");

// // Public
// router.get("/", controller.listPublic);
// router.get("/:id", controller.getPublic);

// // Main admin only (manage_platform)
// router.post(
//   "/",
//   protectMainAdmin,
//   requireMainAdminPermission("manage_platform"),
//   controller.createAdmin
// );

// router.put(
//   "/:id",
//   protectMainAdmin,
//   requireMainAdminPermission("manage_platform"),
//   controller.updateAdmin
// );

// router.delete(
//   "/:id",
//   protectMainAdmin,
//   requireMainAdminPermission("manage_platform"),
//   controller.deleteAdmin
// );

// module.exports = router;

// src/routes/subscriptionRoutes.js
const express = require("express");
const { z } = require("zod");
const router = express.Router();

const subscriptionPlanController = require("../controllers/Subscription.js");
const { protectAdmin } = require("../middleware/auth.js");

// ===================== VALIDATION MIDDLEWARE =====================
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// ===================== SCHEMAS =====================

/**
 * Subscription Plan Creation Schema
 */
const createPlanSchema = z.object({
  plan_name: z.string()
    .min(3, "Plan name must be at least 3 characters")
    .max(100, "Plan name must be less than 100 characters")
    .trim(),
  
  plan_code: z.string()
    .min(2, "Plan code must be at least 2 characters")
    .max(50, "Plan code must be less than 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Plan code must contain only uppercase letters, numbers, and underscores")
    .trim(),
  
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  
  price_per_year: z.number()
    .min(0, "Price per year cannot be negative")
    .max(1000000, "Price per year cannot exceed 1,000,000"),
  
  max_staff: z.number()
    .int("Max staff must be an integer")
    .min(1, "Max staff must be at least 1")
    .max(1000, "Max staff cannot exceed 1000"),
  
  max_tables: z.number()
    .int("Max tables must be an integer")
    .min(1, "Max tables must be at least 1")
    .max(500, "Max tables cannot exceed 500"),
  
  max_menu_items: z.number()
    .int("Max menu items must be an integer")
    .min(1, "Max menu items must be at least 1")
    .max(10000, "Max menu items cannot exceed 10000"),
  
  features: z.object({
    // Define expected features structure
    // This is flexible but we'll validate basic structure
    analytics: z.boolean().optional(),
    multi_branch: z.boolean().optional(),
    custom_domain: z.boolean().optional(),
    priority_support: z.boolean().optional(),
    api_access: z.boolean().optional(),
    white_label: z.boolean().optional()
  }).optional().default({}),
  
  display_order: z.number()
    .int("Display order must be an integer")
    .min(0, "Display order must be at least 0")
    .optional()
    .default(0),
  
  is_active: z.boolean()
    .optional()
    .default(true)
});

/**
 * Subscription Plan Update Schema
 */
const updatePlanSchema = z.object({
  plan_name: z.string()
    .min(3, "Plan name must be at least 3 characters")
    .max(100, "Plan name must be less than 100 characters")
    .trim()
    .optional(),
  
  plan_code: z.string()
    .min(2, "Plan code must be at least 2 characters")
    .max(50, "Plan code must be less than 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Plan code must contain only uppercase letters, numbers, and underscores")
    .trim()
    .optional(),
  
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  
  price_per_year: z.number()
    .min(0, "Price per year cannot be negative")
    .max(1000000, "Price per year cannot exceed 1,000,000")
    .optional(),
  
  max_staff: z.number()
    .int("Max staff must be an integer")
    .min(1, "Max staff must be at least 1")
    .max(1000, "Max staff cannot exceed 1000")
    .optional(),
  
  max_tables: z.number()
    .int("Max tables must be an integer")
    .min(1, "Max tables must be at least 1")
    .max(500, "Max tables cannot exceed 500")
    .optional(),
  
  max_menu_items: z.number()
    .int("Max menu items must be an integer")
    .min(1, "Max menu items must be at least 1")
    .max(10000, "Max menu items cannot exceed 10000")
    .optional(),
  
  features: z.object({
    analytics: z.boolean().optional(),
    multi_branch: z.boolean().optional(),
    custom_domain: z.boolean().optional(),
    priority_support: z.boolean().optional(),
    api_access: z.boolean().optional(),
    white_label: z.boolean().optional()
  }).optional(),
  
  display_order: z.number()
    .int("Display order must be an integer")
    .min(0, "Display order must be at least 0")
    .optional(),
  
  is_active: z.boolean()
    .optional()
});

/**
 * Query Parameters Schema
 */
const listPlansQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  limit: z.string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1).max(200))
    .optional(),
  offset: z.string()
    .regex(/^\d+$/, "Offset must be a number")
    .transform(Number)
    .pipe(z.number().int().min(0))
    .optional()
});

// ===================== PUBLIC ROUTES (anyone) =====================

/**
 * @route GET /api/subscription-plans
 * @desc List all subscription plans (public)
 * @access Public
 * @query {string} active - Filter by active status (true/false, default: true)
 * @query {number} limit - Items per page (max 200, default: 100)
 * @query {number} offset - Pagination offset (default: 0)
 * @returns {object} List of subscription plans
 */
router.get("/", async (req, res, next) => {
  try {
    // Validate query parameters
    const queryValidation = listPlansQuerySchema.safeParse(req.query);
    const query = queryValidation.success ? queryValidation.data : {};
    
    const activeOnly = query.active !== "false";
    const limit = query.limit ? parseInt(query.limit) : 100;
    const offset = query.offset ? parseInt(query.offset) : 0;

    const plans = await subscriptionPlanController.listPublicPlans({ 
      activeOnly, 
      limit, 
      offset 
    });
    
    return res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/subscription-plans/:id
 * @desc Get subscription plan by ID (public)
 * @access Public
 * @param {string} id - Plan ID (UUID)
 * @returns {object} Subscription plan details
 */
router.get("/:id", subscriptionPlanController.getPublicPlanById);

// ===================== ADMIN ROUTES (protected) =====================

/**
 * @route POST /api/subscription-plans/create
 * @desc Create new subscription plan (admin only)
 * @access Private (Admin only)
 * @body {string} plan_name - Plan name (3-100 chars)
 * @body {string} plan_code - Unique plan code (uppercase, underscores)
 * @body {string} description - Plan description (max 500 chars)
 * @body {number} price_per_year - Annual price (0-1,000,000)
 * @body {number} max_staff - Maximum staff members (1-1000)
 * @body {number} max_tables - Maximum tables (1-500)
 * @body {number} max_menu_items - Maximum menu items (1-10000)
 * @body {object} features - Plan features object
 * @body {number} display_order - Display order (default: 0)
 * @body {boolean} is_active - Plan active status (default: true)
 * @returns {object} Created plan ID
 */
router.post("/create", protectAdmin, validate(createPlanSchema), subscriptionPlanController.createPlan);

/**
 * @route PUT /api/subscription-plans/:id
 * @desc Update subscription plan (admin only)
 * @access Private (Admin only)
 * @param {string} id - Plan ID (UUID)
 * @body {object} - Any plan fields to update
 * @returns {object} Updated plan ID
 */
router.put("/:id", protectAdmin, validate(updatePlanSchema), subscriptionPlanController.updatePlan);

/**
 * @route DELETE /api/subscription-plans/:id
 * @desc Hard delete subscription plan (admin only)
 * @access Private (Admin only)
 * @param {string} id - Plan ID (UUID)
 * @warning Hard delete removes the plan permanently. Use with caution.
 * @returns {object} Deleted plan ID
 */
router.delete("/:id", protectAdmin, subscriptionPlanController.deletePlan);

/**
 * @route PATCH /api/subscription-plans/:id/disable
 * @desc Soft disable subscription plan (admin only) - Recommended
 * @access Private (Admin only)
 * @param {string} id - Plan ID (UUID)
 * @returns {object} Disabled plan ID
 */
router.patch("/:id/disable", protectAdmin, subscriptionPlanController.disablePlan);

module.exports = router;