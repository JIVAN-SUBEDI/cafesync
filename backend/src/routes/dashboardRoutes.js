
const express = require("express");
const router = express.Router();
// const { validate } = require("../middleware/validation");
const {
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

  validate
} = require("../middleware/dashboardValidation");

console.log("Loading hotel routes...");

// Import controllers
const dashboardController = require("../controllers/dashboardController.js");
const staffController = require("../controllers/staffController.js");
const menuController = require("../controllers/menuController.js");
const tablesController = require("../controllers/tablesController.js");
const inventoryController = require("../controllers/inventoryController.js");
const ordersController = require("../controllers/ordersController.js");
const hotelAdminProfileController = require("../controllers/hotelAdminProfileController.js");
// const ordersController = require('../controllers/ordersController.js')


// Import middleware
const { protectHotelAdmin, protectStaff } = require("../middleware/auth");
const upload = require("../middleware/upload.js");

// ===================== DASHBOARD ROUTES =====================
/**
 * @route GET /api/hotel/dashboard
 * @desc Get dashboard data with statistics, recent orders, staff, tables, etc.
 * @access Private (Hotel Admin only)
 */
router.get("/dashboard", protectHotelAdmin, dashboardController.getDashboardData);

router.get("/staff", protectHotelAdmin, staffController.getAllStaff);

router.get("/staff/:id", protectHotelAdmin, staffController.getStaffById);


router.post("/staff", upload.single("profile_img"), protectHotelAdmin, validate(staffCreateSchema), staffController.createStaff);

router.put("/staff/:id", upload.single("profile_img"), protectHotelAdmin, validate(staffUpdateSchema), staffController.updateStaff);

router.delete("/staff/:id", protectHotelAdmin, staffController.deleteStaff);

router.patch("/staff/:id/change", protectHotelAdmin, staffController.toggleStaffStatus);

router.get("/menu/categories", protectHotelAdmin, menuController.getAllCategories);

router.post("/menu/categories", upload.single("image"), protectHotelAdmin, validate(categoryCreateSchema), menuController.createCategory);

router.put("/menu/categories/:id", upload.single("image"), protectHotelAdmin, validate(categoryUpdateSchema), menuController.updateCategory);

router.delete("/menu/categories/:id", protectHotelAdmin, menuController.deleteCategory);

router.get("/menu/items", protectHotelAdmin, menuController.getAllMenuItems);
router.get("/menu/items/phone", protectHotelAdmin, menuController.getAllMenusForPhone);


router.get("/menu/items/:id", protectHotelAdmin, menuController.getMenuItemById);

router.post("/menu/items", upload.single("image"), protectHotelAdmin, validate(menuItemCreateSchema), menuController.createMenuItem);

router.put("/menu/items/:id", upload.single("image"), protectHotelAdmin, validate(menuItemUpdateSchema), menuController.updateMenuItem);

router.delete("/menu/items/:id", protectHotelAdmin, menuController.deleteMenuItem);

// ===================== TABLES ROUTES =====================
router.get("/tables", protectHotelAdmin, tablesController.getAllTables);

/**
 * @route GET /api/hotel/tables/:id
 * @desc Get table by ID with current order info
 * @access Private (Hotel Admin only)
 */
router.get("/tables/:id", protectHotelAdmin, tablesController.getTableById);

/**
 * @route POST /api/hotel/tables
 * @desc Create new table
 * @access Private (Hotel Admin only)
 * @body {string} table_number - Optional table number (auto-generated)
 * @body {string} table_name - Optional table name
 * @body {number} capacity - Table capacity
 * @body {number} floor_number - Floor number
 * @body {string} section - Section name
 */
router.post("/tables", protectHotelAdmin, validate(tableCreateSchema), tablesController.createTable);

router.put("/tables/:id", protectHotelAdmin, validate(tableUpdateSchema), tablesController.updateTable);

router.put("/tables/:id/status", protectHotelAdmin, validate(tableStatusUpdateSchema), tablesController.updateTableStatus);

router.delete("/tables/:id", protectHotelAdmin, tablesController.deleteTable);

// ===================== INVENTORY ROUTES =====================

router.get("/inventory/categories", protectHotelAdmin, inventoryController.getCategories);

router.post("/inventory/categories", protectHotelAdmin, inventoryController.createCategory);

router.get("/inventory/alerts", protectHotelAdmin, inventoryController.getAlerts);
router.put("/inventory/alerts/:id/read", protectHotelAdmin, inventoryController.markAlertRead);


router.put("/inventory/alerts/:id/resolve", protectHotelAdmin, inventoryController.resolveAlert);

/**
 * @route GET /api/hotel/inventory/low-stock
 * @desc Get low stock inventory items
 * @access Private (Hotel Admin only)
 */
router.get("/inventory/low-stock", protectHotelAdmin, inventoryController.getLowStock);

/**
 * @route GET /api/hotel/inventory/expiring-soon
 * @desc Get expiring soon inventory items
 * @access Private (Hotel Admin only)
 */
router.get("/inventory/expiring-soon", protectHotelAdmin, inventoryController.getExpiringSoon);

/**
 * @route GET /api/hotel/inventory/valuation
 * @desc Get inventory valuation summary
 * @access Private (Hotel Admin only)
 */
router.get("/inventory/valuation", protectHotelAdmin, inventoryController.getValuation);

/**
 * @route GET /api/hotel/inventory/transactions/:inventoryId
 * @desc Get transaction history for inventory item
 * @access Private (Hotel Admin only)
 */
router.get("/inventory/transactions/:inventoryId", protectHotelAdmin, inventoryController.getTransactions);

/**
 * @route POST /api/hotel/inventory/transactions
 * @desc Create inventory transaction (purchase, sale, adjustment, etc.)
 * @access Private (Hotel Admin only)
 */
router.post("/inventory/transactions", protectHotelAdmin, validate(inventoryTransactionSchema), inventoryController.createTransaction);

/**
 * @route GET /api/hotel/inventory
 * @desc Get all inventory items with pagination and filters
 * @access Private (Hotel Admin only)
 */
router.get("/inventory", protectHotelAdmin, inventoryController.getAllInventory);

/**
 * @route GET /api/hotel/inventory/:id
 * @desc Get inventory item by ID
 * @access Private (Hotel Admin only)
 * @note This must come AFTER all specific routes like /categories, /alerts, etc.
 */
router.get("/inventory/:id", protectHotelAdmin, inventoryController.getInventoryItem);

/**
 * @route POST /api/hotel/inventory
 * @desc Create new inventory item
 * @access Private (Hotel Admin only)
 */
router.post("/inventory", protectHotelAdmin, validate(inventoryCreateSchema), inventoryController.createInventoryItem);

/**
 * @route PUT /api/hotel/inventory/:id
 * @desc Update inventory item
 * @access Private (Hotel Admin only)
 */
router.put("/inventory/:id", protectHotelAdmin, validate(inventoryUpdateSchema), inventoryController.updateInventoryItem);

/**
 * @route DELETE /api/hotel/inventory/:id
 * @desc Soft delete inventory item
 * @access Private (Hotel Admin only)
 */
router.delete("/inventory/:id", protectHotelAdmin, inventoryController.deleteInventoryItem);

// ===================== ORDERS ROUTES =====================
/**
 * @route GET /api/hotel/orders
 * @desc Get all orders with pagination and filters
 * @access Private (Hotel Admin only)
 * @query {string} status - Filter by order status
 * @query {string} payment_status - Filter by payment status
 * @query {string} date - Filter by date (YYYY-MM-DD)
 * @query {string} waiter_id - Filter by waiter
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 */
router.get("/orders", protectHotelAdmin, ordersController.getAllOrders);
router.get("/analytics", protectHotelAdmin, ordersController.getAnalytics);

/**
 * @route GET /api/hotel/orders/:id
 * @desc Get order by ID with items
 * @access Private (Hotel Admin only)
 */
router.get("/orders/:id", protectHotelAdmin, ordersController.getOrderById);

/**
 * @route POST /api/hotel/orders
 * @desc Create new order
 * @access Private (Hotel Admin only)
 * @body {string} table_id - Optional table ID
 * @body {string} waiter_id - Optional waiter ID
 * @body {string} customer_name - Optional customer name
 * @body {string} customer_phone - Optional customer phone (must be 10 digits if provided)
 * @body {string} special_instructions - Special instructions
 * @body {string} kitchen_notes - Kitchen notes
 * @body {number} discount_amount - Discount amount
 * @body {array} items - Order items
 */
router.post("/orders", protectHotelAdmin, validate(orderCreateSchema), ordersController.createOrder);

/**
 * @route PUT /api/hotel/orders/:id
 * @desc Update order details
 * @access Private (Hotel Admin only)
 * @body {string} table_id - Optional table ID
 * @body {string} waiter_id - Optional waiter ID
 * @body {string} customer_name - Optional customer name
 * @body {string} customer_phone - Optional customer phone (must be 10 digits if provided)
 * @body {string} special_instructions - Special instructions
 * @body {string} kitchen_notes - Kitchen notes
 * @body {number} discount_amount - Discount amount
 * @body {string} status - Order status
 * @body {string} payment_status - Payment status
 * @body {string} payment_method - Payment method
 * @body {number} paid_amount - Paid amount
 * @body {array} items - Order items
 */
router.put("/orders/:id", protectHotelAdmin, validate(orderUpdateSchema), ordersController.updateOrder);

/**
 * @route PUT /api/hotel/orders/:id/status
 * @desc Update order status
 * @access Private (Hotel Admin only)
 */
router.put("/orders/:id/status", protectHotelAdmin, validate(orderStatusUpdateSchema), ordersController.updateOrderStatus);

/**
 * @route PUT /api/hotel/orders/:id/payment
 * @desc Update payment status
 * @access Private (Hotel Admin only)
 */
// router.put("/orders/:id/payment", protectHotelAdmin, validate(paymentUpdateSchema), ordersController.updatePaymentStatus);

/**
 * @route DELETE /api/hotel/orders/:id
 * @desc Delete order (only if cancelled)
 * @access Private (Hotel Admin only)
 */
router.delete("/orders/:id", protectHotelAdmin, ordersController.deleteOrder);

// Order Items
/**
 * @route GET /api/hotel/orders/:orderId/items
 * @desc Get items for an order
 * @access Private (Hotel Admin only)
 */
router.get("/orders/:orderId/items", protectHotelAdmin, ordersController.getOrderItems);

/**
 * @route POST /api/hotel/orders/:orderId/items
 * @desc Add item to order
 * @access Private (Hotel Admin only)
 */
router.post("/orders/:orderId/items", protectHotelAdmin, ordersController.addOrderItem);

/**
 * @route PUT /api/hotel/orders/items/:itemId
 * @desc Update order item
 * @access Private (Hotel Admin only)
 */
router.put("/orders/items/:itemId", protectHotelAdmin, validate(orderItemUpdateSchema), ordersController.updateOrderItem);

/**
 * @route DELETE /api/hotel/orders/items/:itemId
 * @desc Remove item from order
 * @access Private (Hotel Admin only)
 */
router.delete("/orders/items/:itemId", protectHotelAdmin, ordersController.deleteOrderItem);

// Kitchen Orders
/**
 * @route GET /api/hotel/kitchen/orders
 * @desc Get kitchen orders (pending/preparing/ready)
 * @access Private (Hotel Admin only)
 */
router.get("/kitchen/orders", protectHotelAdmin, ordersController.getKitchenOrders);

/**
 * @route PUT /api/hotel/kitchen/orders/:orderId/items/:itemId/status
 * @desc Update kitchen item status
 * @access Private (Hotel Admin only)
 */
router.put("/kitchen/orders/:orderId/status", protectHotelAdmin, validate(kitchenItemStatusUpdateSchema), ordersController.updateOrderStatus);

// ===================== HOTEL PROFILE ROUTES =====================
/**
 * @route PUT /api/hotel/me/profile
 * @desc Update hotel profile
 * @access Private (Hotel Admin only)
 * @body {string} hotel_name - Hotel name
 * @body {string} hotel_phone - Hotel phone
 * @body {string} hotel_address - Hotel address
 * @body {string} city - City
 * @body {string} country - Country
 * @body {string} timezone - Timezone
 * @body {string} currency - Currency (USD/NPR/INR)
 * @body {number} tax_rate - Tax rate (0-1)
 * @body {number} service_charge - Service charge (0-1)
 */
router.put("/me/profile", protectHotelAdmin, validate(hotelProfileUpdateSchema), hotelAdminProfileController.updateMyHotelProfile);
router.post(
  "/orders/:orderId/payment",
  protectHotelAdmin,
  ordersController.addOrderPayment
);

module.exports = router;