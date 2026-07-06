const express = require("express");
const router = express.Router();
const { z } = require("zod");

const authController = require("../controllers/authAdmin.js");
const { protectAdmin } = require("../middleware/auth.js");

// ----------------------------
// Zod validation middleware
// ----------------------------
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
    cookies: req.cookies,
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

  // overwrite with validated values
  req.body = result.data.body || req.body;
  req.params = result.data.params || req.params;
  req.query = result.data.query || req.query;
  req.cookies = result.data.cookies || req.cookies;

  next();
};

// ----------------------------
// Schemas
// ----------------------------
const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Enter a valid email")
      .transform((val) => val.toLowerCase()),
    password: z
      .string({ required_error: "Password is required" })
      .trim()
      .min(1, "Password is required"),
  }),
});

// const registerSchema = z.object({
//   body: z.object({
//     full_name: z
//       .string({ required_error: "name is required" })
//       .trim()
//       .full_name("Enter name")
//       .transform((val) => val.transform()),
//     email: z
//       .string({ required_error: "Email is required" })
//       .trim()
//       .email("Enter a valid email")
//       .transform((val) => val.toLowerCase()),
//     password: z
//       .string({ required_error: "Password is required" })
//       .trim()
//       .min(1, "Password is required"),
//   }),
// });

const refreshSchema = z
  .object({
    body: z
      .object({
        refreshToken: z
          .string()
          .trim()
          .min(1, "Refresh token is required")
          .optional(),
      })
      .optional()
      .default({}),
    cookies: z
      .object({
        admin_refresh: z.string().trim().min(1).optional(),
      })
      .optional()
      .default({}),
  })
  .refine(
    (data) => !!data.body?.refreshToken || !!data.cookies?.admin_refresh,
    {
      message: "Refresh token required",
      path: ["refreshToken"],
    },
  );

// ----------------------------
// Routes
// ----------------------------
router.post("/login", validate(loginSchema), authController.adminLogin);

router.post("/refresh", validate(refreshSchema), authController.refreshToken);

router.post("/logout", protectAdmin, authController.adminLogout);

router.get("/profile", protectAdmin, authController.getAdminProfile);

module.exports = router;



router.post("/register",  authController.createAdmin);
