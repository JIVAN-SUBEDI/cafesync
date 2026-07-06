const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255),
  password: z.string().min(1, "Password is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Hotel slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  rememberMe: z.boolean().optional().default(false),
});

const registrationSchema = z.object({
  hotel_name: z.string().trim().min(2).max(255),
  hotel_slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  hotel_img: z.string().trim().optional().nullable(),

 admin_name: z.string().trim().min(2).max(255),
 admin_email: z.string().trim().email().max(255),
admin_password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(255)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
 admin_phone: z.string().trim().optional().nullable(),

  hotel_phone: z.string().trim().optional().nullable(),
  hotel_address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  timezone: z.string().trim().optional().nullable(),
  currency: z.string().trim().optional().nullable(),

  tax_rate: z.coerce.number().optional(),
  service_charge: z.coerce.number().optional(),

  subscription_plan_id: z.string().uuid().optional().nullable(),
  registration_type: z.enum(["trial", "subscription"]).optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
  payment_method: z.enum(["esewa", "khalti"]).optional(),
  accept_marketing: z.union([z.boolean(), z.string()]).optional(),
});

module.exports = {
  loginSchema,
  registrationSchema,
};