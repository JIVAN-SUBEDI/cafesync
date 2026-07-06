
// src/routes/adminDashboardRoutes.js
const express = require("express");
const router = express.Router();
const { z } = require("zod");

const { protectAdmin } = require("../middleware/auth");
const dashboardController = require("../controllers/adminDashboardController");

// ----------------------------
// All routes require admin authentication
// ----------------------------
router.use(protectAdmin);

// ----------------------------
// Zod validation middleware
// ----------------------------
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.body = result.data.body || req.body;
  req.params = result.data.params || req.params;
  req.query = result.data.query || req.query;

  next();
};

// ----------------------------
// Common schemas
// ----------------------------
const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid subscription ID"),
  }),
});

const statsQuerySchema = z.object({
  query: z.object({
    range: z.enum(["7d", "30d", "90d", "1y"]).optional(),
  }),
});

const exportQuerySchema = z.object({
  query: z.object({
    type: z.enum(["hotels", "orders", "staff"]).optional(),
  }),
});

const getSubscriptionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    status: z.enum(["all", "active", "inactive"]).optional(),
  }),
});

const createSubscriptionSchema = z.object({
  body: z.object({
    plan_name: z.string().trim().min(1, "Plan name is required"),
    plan_code: z.string().trim().min(1, "Plan code is required"),
    description: z.string().trim().optional(),
    price_per_year: z.coerce.number().positive("Price per year must be greater than 0"),
    max_staff: z.coerce.number().int().min(0).optional(),
    max_tables: z.coerce.number().int().min(0).optional(),
    max_menu_items: z.coerce.number().int().min(0).optional(),
    features: z.record(z.any()).optional(),
    display_order: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

const updateSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid subscription ID"),
  }),
  body: z.object({
    plan_name: z.string().trim().min(1).optional(),
    plan_code: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    price_per_year: z.coerce.number().positive("Price per year must be greater than 0").optional(),
    max_staff: z.coerce.number().int().min(0).optional(),
    max_tables: z.coerce.number().int().min(0).optional(),
    max_menu_items: z.coerce.number().int().min(0).optional(),
    features: z.record(z.any()).optional(),
    display_order: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update",
      path: ["body"],
    }
  ),
});

const hotelsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    status: z.enum(["all", "active", "inactive"]).optional(),
    subscription_status: z.enum(["all", "trial", "active", "suspended", "cancelled"]).optional(),
    plan_id: z.string().uuid("Invalid plan_id").optional().or(z.literal("")),
    sort_by: z.enum([
      "created_at",
      "hotel_name",
      "city",
      "country",
      "subscription_status",
      "is_active",
      "total_revenue",
      "total_orders",
      "staff_count",
    ]).optional(),
    sort_order: z.enum(["asc", "desc", "ASC", "DESC"]).optional(),
  }),
});

// ----------------------------
// Routes
// ----------------------------

// Get dashboard stats
router.get(
  "/stats",
  validate(statsQuerySchema),
  dashboardController.getDashboardStats
);

// Export data
router.get(
  "/export",
  validate(exportQuerySchema),
  dashboardController.exportDashboardData
);

// Subscription CRUD routes
router.get(
  "/subscriptions",
  validate(getSubscriptionsQuerySchema),
  dashboardController.getAllSubscriptions
);

router.get(
  "/subscriptions/:id",
  validate(uuidParamSchema),
  dashboardController.getSubscriptionById
);

router.post(
  "/subscriptions",
  validate(createSubscriptionSchema),
  dashboardController.createSubscription
);

router.put(
  "/subscriptions/:id",
  validate(updateSubscriptionSchema),
  dashboardController.updateSubscription
);

router.delete(
  "/subscriptions/:id",
  validate(uuidParamSchema),
  dashboardController.deleteSubscription
);

router.patch(
  "/subscriptions/:id/toggle",
  validate(uuidParamSchema),
  dashboardController.toggleSubscriptionStatus
);

router.get(
  "/hotels",
  validate(hotelsQuerySchema),
  dashboardController.getAllHotelsForAdminDashboard
);

module.exports = router;


