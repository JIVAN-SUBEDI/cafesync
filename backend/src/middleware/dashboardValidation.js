const { z } = require("zod");

// ===================== HELPERS =====================
const passwordRule =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const emptyToUndefined = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const optionalBooleanFromForm = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const optionalJsonRecordFromForm = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}, z.record(z.boolean()).optional());

const optionalStringField = () =>
  z.preprocess(
    (value) => emptyToUndefined(typeof value === "string" ? value.trim() : value),
    z.string().optional()
  );

const optionalNullableStringField = () =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  }, z.string().nullable().optional());

const optionalPasswordField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return typeof value === "string" ? value.trim() : value;
},
z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    passwordRule,
    "Password must include uppercase, lowercase, number, and special character"
  )
  .optional());

  
const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || /^\d{10}$/.test(val), {
    message: "Phone number must be exactly 10 digits",
  })
  .transform((val) => (val === "" ? null : val))
  .optional()
  .nullable();

const optionalTextNullable = z
  .string()
  .trim()
  .transform((val) => (val === "" ? null : val))
  .optional()
  .nullable();

const optionalUrlNullable = z
  .string()
  .trim()
  .url("Please enter a valid URL")
  .transform((val) => (val === "" ? null : val))
  .optional()
  .nullable();

// ===================== STAFF VALIDATION =====================
const staffCreateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Full name is too long"),
  role: z.enum(
    ["hotel_admin", "waiter", "billing", "kitchen"],
    {
      errorMap: () => ({
        message:
          "Please select a valid role: Hotel Admin, , Billing, Waiter, Kitchen",
      }),
    }
  ),
  phone_number: optionalPhoneSchema,
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRule,
      "Password must include uppercase, lowercase, number, and special character"
    ),
  // permissions: z.record(z.boolean()).optional()
});


const staffUpdateSchema = z.object({
  full_name: z.preprocess(
    (value) => emptyToUndefined(typeof value === "string" ? value.trim() : value),
    z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(255, "Full name is too long")
      .optional()
  ),

  role: z.preprocess(
    (value) => emptyToUndefined(value),
    z
      .enum(["hotel_admin", "waiter", "billing", "kitchen"], {
        errorMap: () => ({
          message:
            "Please select a valid role: Hotel Admin, , Billing, Waiter, Kitchen",
        }),
      })
      .optional()
  ),

  phone_number: optionalPhoneSchema,

  email: z.preprocess(
    (value) => emptyToUndefined(typeof value === "string" ? value.trim() : value),
    z.string().email("Please enter a valid email address").optional()
  ),

  password: optionalPasswordField,

  permissions: optionalJsonRecordFromForm,

  is_active: optionalBooleanFromForm,
});

const staffLoginSchema = z.object({
  hotel_id: z.string().uuid("Hotel ID is invalid"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// ===================== MENU VALIDATION =====================
const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters"),
  description: optionalTextNullable,
  display_order: z.coerce
    .number({
      invalid_type_error: "Display order must be a number",
    })
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional(),
  image_url: optionalUrlNullable,
});

const categoryUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .optional(),
  description: optionalTextNullable,
  display_order: z.coerce
    .number({
      invalid_type_error: "Display order must be a number",
    })
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional(),
  image_url: optionalUrlNullable,
  is_active: z.coerce.boolean().optional(),
});

const menuItemCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Item name must be at least 2 characters"),

  category_id: z.string().uuid("Category ID is invalid"),

  description: optionalTextNullable,

  price: z.coerce
    .number({
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),

  cost_price: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined || value === "null") {
      return null;
    }
    return value;
  }, z.coerce.number().positive("Cost price must be greater than 0").nullable().optional()),

  tax_rate: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return 0;
    return value;
  }, z.coerce.number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot be more than 100")
    .optional()),

  preparation_time: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined || value === "null") {
      return null;
    }
    return value;
  }, z.coerce.number()
    .int("Preparation time must be a whole number")
    .min(0, "Preparation time cannot be negative")
    .nullable()
    .optional()),

  is_available: z.coerce.boolean().optional(),
  is_popular: z.coerce.boolean().optional(),
  is_vegetarian: z.coerce.boolean().optional(),

  dietary_info: optionalTextNullable,
  image_url: optionalUrlNullable,
});

const menuItemUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Item name must be at least 2 characters")
    .optional(),

  category_id: z.string().uuid("Category ID is invalid").optional(),

  description: optionalTextNullable,

  price: z.coerce
    .number({
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0")
    .optional(),

  cost_price: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined || value === "null") {
      return null;
    }
    return value;
  }, z.coerce.number().positive("Cost price must be greater than 0").nullable().optional()),

  tax_rate: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.coerce.number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot be more than 100")
    .optional()),

  preparation_time: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined || value === "null") {
      return null;
    }
    return value;
  }, z.coerce.number()
    .int("Preparation time must be a whole number")
    .min(0, "Preparation time cannot be negative")
    .nullable()
    .optional()),

  is_available: z.coerce.boolean().optional(),
  is_popular: z.coerce.boolean().optional(),
  is_vegetarian: z.coerce.boolean().optional(),

  dietary_info: optionalTextNullable,
  image_url: optionalUrlNullable,
});

// ===================== TABLE VALIDATION =====================
const tableCreateSchema = z.object({
  table_number: z.string().trim().optional(),
  table_name: optionalTextNullable,
  capacity: z.number().int("Capacity must be a whole number").positive("Capacity must be greater than 0"),
  floor_number: z.number().int("Floor number must be a whole number").min(0, "Floor number cannot be negative").optional(),
  section: z.string().trim().optional(),
});

const tableUpdateSchema = z.object({
  table_number: z.string().trim().optional(),
  table_name: optionalTextNullable,
  capacity: z.number().int("Capacity must be a whole number").positive("Capacity must be greater than 0").optional(),
  floor_number: z.number().int("Floor number must be a whole number").min(0, "Floor number cannot be negative").optional(),
  section: z.string().trim().optional(),
  qr_code_url: optionalUrlNullable,
});

const tableStatusUpdateSchema = z.object({
  status: z.enum(["available", "occupied", "reserved", "cleaning"], {
    errorMap: () => ({
      message: "Status must be available, occupied, reserved, or cleaning",
    }),
  }),
  waiter_id: z.string().uuid("Waiter ID is invalid").optional(),
  order_id: z.string().uuid("Order ID is invalid").optional(),
});

// ===================== INVENTORY VALIDATION =====================
const inventoryCreateSchema = z.object({
  category_id: z.string().uuid("Category ID is invalid").optional().nullable(),
  item_name: z
    .string()
    .trim()
    .min(2, "Item name must be at least 2 characters"),
  description: optionalTextNullable,
  current_quantity: z.number().min(0, "Current quantity cannot be negative").optional().default(0),
  min_quantity: z.number().min(0, "Minimum quantity cannot be negative").optional().default(10),
  max_quantity: z.number().min(0, "Maximum quantity cannot be negative").optional().nullable(),
  unit: z.string().trim().min(1, "Unit is required"),
  unit_cost: z.number().min(0, "Unit cost cannot be negative").optional().default(0),
  supplier_name: optionalTextNullable,
  supplier_contact: optionalTextNullable,
  supplier_price: z.number().min(0, "Supplier price cannot be negative").optional().nullable(),
  last_purchased_date: z.string().datetime("Last purchased date must be a valid datetime").optional().nullable(),
  reorder_point: z.number().min(0, "Reorder point cannot be negative").optional().nullable(),
  location: optionalTextNullable,
  barcode: optionalTextNullable,
  expiry_date: z.string().datetime("Expiry date must be a valid datetime").optional().nullable(),
});

const inventoryUpdateSchema = z.object({
  category_id: z.string().uuid("Category ID is invalid").optional().nullable(),
  item_name: z.string().trim().min(2, "Item name must be at least 2 characters").optional(),
  description: optionalTextNullable,
  min_quantity: z.number().min(0, "Minimum quantity cannot be negative").optional(),
  max_quantity: z.number().min(0, "Maximum quantity cannot be negative").optional().nullable(),
  unit: z.string().trim().optional(),
  unit_cost: z.number().min(0, "Unit cost cannot be negative").optional(),
  supplier_name: optionalTextNullable,
  supplier_contact: optionalTextNullable,
  supplier_price: z.number().min(0, "Supplier price cannot be negative").optional().nullable(),
  last_purchased_date: z.string().datetime("Last purchased date must be a valid datetime").optional().nullable(),
  reorder_point: z.number().min(0, "Reorder point cannot be negative").optional().nullable(),
  location: optionalTextNullable,
  barcode: optionalTextNullable,
  expiry_date: z.string().datetime("Expiry date must be a valid datetime").optional().nullable(),
  is_active: z.coerce.boolean().optional(),
  status: z.enum(
    ["in_stock", "low_stock", "out_of_stock", "over_stock", "discontinued"],
    {
      errorMap: () => ({
        message:
          "Status must be in_stock, low_stock, out_of_stock, over_stock, or discontinued",
      }),
    }
  ).optional(),
});

const inventoryTransactionSchema = z.object({
  inventory_id: z.string().uuid("Inventory ID is invalid"),
  transaction_type: z.enum(
    ["purchase", "sale", "adjustment", "wastage", "transfer", "production", "consumption"],
    {
      errorMap: () => ({
        message:
          "Transaction type must be purchase, sale, adjustment, wastage, transfer, production, or consumption",
      }),
    }
  ),
  quantity_change: z.number().positive("Quantity change must be greater than 0"),
  unit_price: z.number().min(0, "Unit price cannot be negative").optional(),
  reference_number: z.string().trim().optional(),
  order_id: z.string().uuid("Order ID is invalid").optional(),
  notes: z.string().trim().optional(),
  reason: z.string().trim().optional(),
});

// ===================== ORDER VALIDATION =====================
const orderCreateSchema = z.object({
  table_id: z.string().uuid("Table ID is invalid").optional().nullable(),
  waiter_id: z.string().uuid("Waiter ID is invalid").optional().nullable(),
  customer_name: optionalTextNullable,
  customer_phone: optionalPhoneSchema,
  special_instructions: optionalTextNullable,
  kitchen_notes: optionalTextNullable,
  discount_amount: z.number().min(0, "Discount amount cannot be negative").optional().default(0),
  tax_amount: z.number().min(0, "Tax amount cannot be negative").optional().default(0),
  service_charge: z.number().min(0, "Service charge cannot be negative").optional().default(0),
  subtotal: z.number().min(0, "Subtotal cannot be negative").optional().default(0),
  total_amount: z.number().min(0, "Total amount cannot be negative").optional().default(0),
  payment_method: z.enum(["cash", "card", "mobile", "other"]).optional().nullable(),
  paid_amount: z.number().min(0, "Paid amount cannot be negative").optional().default(0),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "served", "cancelled", "completed"]).optional().default("pending"),
  payment_status: z.enum(["pending", "partial", "paid", "refunded", "partially_paid"]).optional().default("pending"),
  items: z.array(z.object({
    menu_item_id: z.string().uuid("Menu item ID is invalid"),
    quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price cannot be negative").optional(),
    special_instructions: z.string().trim().optional().nullable(),
  })).optional(),
});

const orderUpdateSchema = z.object({
  table_id: z.string().uuid("Table ID is invalid").optional().nullable(),
  waiter_id: z.string().uuid("Waiter ID is invalid").optional().nullable(),
  customer_name: optionalTextNullable,
  customer_phone: optionalPhoneSchema,
  special_instructions: optionalTextNullable,
  kitchen_notes: optionalTextNullable,
  discount_amount: z.number().min(0, "Discount amount cannot be negative").optional(),
  tax_amount: z.number().min(0, "Tax amount cannot be negative").optional(),
  service_charge: z.number().min(0, "Service charge cannot be negative").optional(),
  subtotal: z.number().min(0, "Subtotal cannot be negative").optional(),
  total_amount: z.number().min(0, "Total amount cannot be negative").optional(),
  payment_method: z.enum(["cash", "card", "mobile", "other"]).optional().nullable(),
  paid_amount: z.number().min(0, "Paid amount cannot be negative").optional(),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "served", "cancelled", "completed"]).optional(),
  payment_status: z.enum(["pending", "partial", "paid", "refunded", "partially_paid"]).optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid("Menu item ID is invalid"),
    quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price cannot be negative").optional(),
    special_instructions: z.string().trim().optional().nullable(),
  })).optional(),
});
const orderStatusUpdateSchema = z.object({
  status: z.enum(
    ["pending", "confirmed", "preparing", "ready", "served", "cancelled", "completed"],
    {
      errorMap: () => ({
        message:
          "Status must be pending, confirmed, preparing, ready, served, cancelled, or completed",
      }),
    }
  ),
});

const paymentUpdateSchema = z.object({
  payment_status: z.enum(["pending", "partial", "paid", "refunded"], {
    errorMap: () => ({
      message: "Payment status must be pending, partial, paid, or refunded",
    }),
  }),
  payment_method: z.enum(["cash", "card", "mobile", "other"], {
    errorMap: () => ({
      message: "Payment method must be cash, card, mobile, or other",
    }),
  }).optional(),
  paid_amount: z.number().min(0, "Paid amount cannot be negative").optional(),
});

const orderItemCreateSchema = z.object({
  menu_item_id: z.string().uuid("Menu item ID is invalid"),
  quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1"),
  special_instructions: z.string().trim().optional(),
});

const orderItemUpdateSchema = z.object({
  quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1").optional(),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"], {
    errorMap: () => ({
      message: "Status must be pending, preparing, ready, served, or cancelled",
    }),
  }).optional(),
  special_instructions: z.string().trim().optional(),
});

const kitchenItemStatusUpdateSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"], {
    errorMap: () => ({
      message: "Status must be pending, preparing, ready, served, or cancelled",
    }),
  }),
  prepared_by: z.string().uuid("Prepared by staff ID is invalid").optional(),
});

// ===================== HOTEL PROFILE VALIDATION =====================
const hotelProfileUpdateSchema = z.object({
  hotel_name: z.string().trim().min(2, "Hotel name must be at least 2 characters").optional(),
  hotel_phone: optionalPhoneSchema,
  hotel_address: optionalTextNullable,
  city: optionalTextNullable,
  country: optionalTextNullable,
  timezone: optionalTextNullable,
  currency: z.enum(["USD", "NPR", "INR","AED","EUR","GBP"], {
    errorMap: () => ({
      message: "Currency must be USD, NPR, AED, EUR, GBP or INR",
    }),
  }).optional(),
  tax_rate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot be more than 100").optional(),
  service_charge: z.number().min(0, "Service charge cannot be negative").max(100, "Service charge cannot be more than 100").optional(),
});

// ===================== USER-FRIENDLY SUGGESTIONS =====================
const getSuggestion = (field, message) => {
  const suggestions = {
    full_name: "Enter at least 2 letters, for example: John Doe",
    role: "Choose one of the available staff roles from the list",
    phone_number: "Enter exactly 10 digits, for example: 9812345678",
    hotel_phone: "Enter exactly 10 digits, for example: 9812345678",
    customer_phone: "Enter exactly 10 digits, for example: 9812345678",
    email: "Use a valid email like name@example.com",
    password:
      "Use at least 8 characters with uppercase, lowercase, number, and special character, for example: Test@123",
    category_id: "Make sure you are sending a valid category ID",
    table_id: "Make sure you are sending a valid table ID",
    waiter_id: "Make sure you are sending a valid waiter/staff ID",
    order_id: "Make sure you are sending a valid order ID",
    inventory_id: "Make sure you are sending a valid inventory ID",
    menu_item_id: "Make sure you are sending a valid menu item ID",
    prepared_by: "Make sure you are sending a valid staff ID",
    price: "Enter a number greater than 0",
    cost_price: "Enter a number greater than 0",
    quantity: "Enter a whole number greater than 0",
    quantity_change: "Enter a number greater than 0",
    unit: "Enter a unit like kg, pcs, litre, box",
    image_url: "Use a full valid URL, for example: https://example.com/image.jpg",
    qr_code_url: "Use a full valid URL",
    status: "Choose one of the allowed status values",
    payment_status: "Choose one of the allowed payment status values",
    payment_method: "Choose one of the allowed payment methods",
    currency: "Choose one of: USD, NPR, INR",
  };

  return suggestions[field] || `Please check the "${field}" field and try again`;
};

// ===================== VALIDATION MIDDLEWARE =====================
const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Please fix the highlighted fields and try again",
        errors: error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
          suggestion: getSuggestion(e.path.join("."), e.message),
        })),
      });
    }
    next(error);
  }
};

// ===================== EXPORTS =====================
module.exports = {
  // Staff schemas
  staffCreateSchema,
  staffUpdateSchema,
  staffLoginSchema,

  // Menu schemas
  categoryCreateSchema,
  categoryUpdateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,

  // Table schemas
  tableCreateSchema,
  tableUpdateSchema,
  tableStatusUpdateSchema,

  // Inventory schemas
  inventoryCreateSchema,
  inventoryUpdateSchema,
  inventoryTransactionSchema,

  // Order schemas
  orderCreateSchema,
  orderUpdateSchema,
  orderStatusUpdateSchema,
  paymentUpdateSchema,
  orderItemCreateSchema,
  orderItemUpdateSchema,
  kitchenItemStatusUpdateSchema,

  // Hotel schemas
  hotelProfileUpdateSchema,

  // Validator
  validate,
};