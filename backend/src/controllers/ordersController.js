const db = require("../config/database.js");
const { errorResponse } = require("../utils/helpers.js");
const NotificationService = require("../services/notification.service.js")
  // const io = req.app.get("io");
/* =========================
   GET ALL ORDERS
   GET /api/hotel/orders
========================= */
exports.getAllOrders = async (req, res, next) => {

  try {
    const hotelId = req.hotelId;
    const {
      status,
      payment_status,
      date,
      type,
      waiter_id,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

   let query = `
  SELECT 
    o.id,
    o.order_number,
    o.table_id,
    t.table_number,
    o.waiter_id,
    s.full_name as waiter_name,
    o.customer_name,
    o.customer_phone,
    o.subtotal,
    o.tax_amount,
    o.service_charge,
    o.discount_amount,
    o.total_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    o.paid_amount,
    o.special_instructions,
    o.kitchen_notes,
    o.created_at,
    o.updated_at,
    o.served_at,
    o.completed_at,
    COUNT(oi.id) as items_count,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'item_name', oi.item_name,
          'menu_item_name', COALESCE(mi.name, oi.item_name),
          'image_url', mi.image_url,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.total_price,
          'status', oi.status,
          'special_instructions', oi.special_instructions,
          'prepared_by', oi.prepared_by,
          'prepared_at', oi.prepared_at,
          'served_by', oi.served_by,
          'served_at', oi.served_at,
          'created_at', oi.created_at
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::json
    ) as order_items
  FROM orders o
  LEFT JOIN hotel_tables t ON o.table_id = t.id
  LEFT JOIN staff s ON o.waiter_id = s.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE o.hotel_id = $1
`;

    let countQuery = `SELECT COUNT(*) FROM orders WHERE hotel_id = $1`;
    const params = [hotelId];
    const countParams = [hotelId];
    let paramCount = 1;
    let countParamCount = 1;

    if (status) {
      paramCount++;
      countParamCount++;
      query += ` AND o.status = $${paramCount}`;
      countQuery += ` AND status = $${countParamCount}`;
      params.push(status);
      countParams.push(status);
    }
        if (type && type === "kitchen" && !status) {
      paramCount++;
      query += ` AND o.status = ANY($${paramCount})`;
      params.push(['pending', 'preparing', 'ready']);

      countParamCount++;
      countQuery += ` AND status = ANY($${countParamCount})`;
      countParams.push(['pending', 'preparing', 'ready']);
    }

    if (payment_status) {
      paramCount++;
      countParamCount++;
      query += ` AND o.payment_status = $${paramCount}`;
      countQuery += ` AND payment_status = $${countParamCount}`;
      params.push(payment_status);
      countParams.push(payment_status);
    }

    if (date) {
      paramCount++;
      countParamCount++;
      query += ` AND DATE(o.created_at) = $${paramCount}`;
      countQuery += ` AND DATE(created_at) = $${countParamCount}`;
      params.push(date);
      countParams.push(date);
    }

    if (waiter_id) {
      paramCount++;
      countParamCount++;
      query += ` AND o.waiter_id = $${paramCount}`;
      countQuery += ` AND waiter_id = $${countParamCount}`;
      params.push(waiter_id);
      countParams.push(waiter_id);
    }

    query += `
      GROUP BY 
        o.id,
        o.order_number,
        o.table_id,
        t.table_number,
        o.waiter_id,
        s.full_name,
        o.customer_name,
        o.customer_phone,
        o.subtotal,
        o.tax_amount,
        o.service_charge,
        o.discount_amount,
        o.total_amount,
        o.status,
        o.payment_status,
        o.payment_method,
        o.paid_amount,
        o.special_instructions,
        o.kitchen_notes,
        o.created_at,
        o.updated_at,
        o.served_at,
        o.completed_at
      ORDER BY o.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    const orders = result.rows.map((order) => ({
  id: order.id,
  order_number: order.order_number,
  table_id: order.table_id,
  table_number: order.table_number,
  waiter_id: order.waiter_id,
  waiter_name: order.waiter_name,
  customer_name: order.customer_name,
  customer_phone: order.customer_phone,
  subtotal: parseFloat(order.subtotal) || 0,
  tax_amount: parseFloat(order.tax_amount) || 0,
  service_charge: parseFloat(order.service_charge) || 0,
  discount_amount: parseFloat(order.discount_amount) || 0,
  total_amount: parseFloat(order.total_amount) || 0,
  amount: parseFloat(order.total_amount) || 0,
  status: order.status,
  payment_status: order.payment_status,
  payment_method: order.payment_method,
  paid_amount: parseFloat(order.paid_amount) || 0,
  special_instructions: order.special_instructions,
  kitchen_notes: order.kitchen_notes,
  items: parseInt(order.items_count, 10) || 0,
  items_count: parseInt(order.items_count, 10) || 0,
  total_quantity: parseInt(order.total_quantity, 10) || 0,
  order_items: Array.isArray(order.order_items) ? order.order_items : [],
  created_at: order.created_at,
  updated_at: order.updated_at,
  served_at: order.served_at,
  completed_at: order.completed_at,
  time: order.created_at,
}));

    const statsQuery = await db.query(
      `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 END) as active_orders,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
      FROM orders 
      WHERE hotel_id = $1
      `,
      [hotelId]
    );

    const stats = statsQuery.rows[0];

    const todayStatsQuery = await db.query(
      `
      SELECT 
        COUNT(*) as today_orders,
        SUM(total_amount) as today_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as today_completed
      FROM orders 
      WHERE hotel_id = $1 AND DATE(created_at) = CURRENT_DATE
      `,
      [hotelId]
    );

    const todayStats = todayStatsQuery.rows[0];

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
      },
      statistics: {
        total_orders: parseInt(stats.total_orders) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0,
        avg_order_value: parseFloat(stats.avg_order_value) || 0,
        active_orders: parseInt(stats.active_orders) || 0,
        pending_payments: parseInt(stats.pending_payments) || 0,
        paid_orders: parseInt(stats.paid_orders) || 0,
        today_orders: parseInt(todayStats.today_orders) || 0,
        today_revenue: parseFloat(todayStats.today_revenue) || 0,
        today_completed: parseInt(todayStats.today_completed) || 0,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    next(error);
  }
};

/* =========================
   GET ORDER BY ID
   GET /api/hotel/orders/:id
========================= */
exports.getOrderById = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const orderRes = await db.query(
      `
      SELECT 
        o.*,
        t.table_number,
        s.full_name as waiter_name
      FROM orders o
      LEFT JOIN hotel_tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.waiter_id = s.id
      WHERE o.id = $1 AND o.hotel_id = $2
      `,
      [id, hotelId],
    );

    if (orderRes.rows.length === 0) {
      return errorResponse(res, 404, "Order not found");
    }

    const itemsRes = await db.query(
      `
      SELECT 
        oi.*,
        mi.item_code,
        mi.name as menu_item_name
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC
      `,
      [id],
    );

    res.json({
      success: true,
      order: orderRes.rows[0],
      items: itemsRes.rows,
    });
  } catch (error) {
    console.error("Get order by id error:", error);
    next(error);
  }
};


/* =========================
   CREATE ORDER
   POST /api/hotel/orders
========================= */
exports.createOrder = async (req, res, next) => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const hotelId = req.hotelId;

    const {
      table_id,
      waiter_id,
      customer_name,
      customer_phone,
      special_instructions,
      kitchen_notes,
      items,
      tax_amount = 0,
      service_charge = 0,
      discount_amount = 0,
      payment_method = null,
      paid_amount = 0,
    } = req.body;

    if (!hotelId) {
      await client.query("ROLLBACK");
      return errorResponse(res, 401, "Hotel authentication required");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "At least one item required");
    }

    // ===============================
    // ✅ VALIDATE TABLE AND LOCK ROW
    // ===============================
    if (table_id) {
      const tableCheck = await client.query(
        `
        SELECT id, status
        FROM hotel_tables
        WHERE id = $1
          AND hotel_id = $2
        FOR UPDATE
        `,
        [table_id, hotelId]
      );

      if (tableCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 404, "Table not found");
      }
    }

    const orderNumber = await generateOrderNumber(hotelId);

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity || 0);

      if (!item.menu_item_id || !quantity || quantity <= 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Invalid order item quantity");
      }

      const menu = await client.query(
        `
        SELECT id, name, price
        FROM menu_items
        WHERE id = $1
          AND hotel_id = $2
          AND is_available = true
        `,
        [item.menu_item_id, hotelId]
      );

      if (menu.rows.length === 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 404, "Menu item not found or unavailable");
      }

      const price = Number(menu.rows[0].price);
      const total = price * quantity;

      subtotal += total;

      orderItems.push({
        id: item.menu_item_id,
        name: menu.rows[0].name,
        qty: quantity,
        price,
        total,
      });
    }

    const totalAmount =
      subtotal +
      Number(tax_amount || 0) +
      Number(service_charge || 0) -
      Number(discount_amount || 0);

    const result = await client.query(
      `
      INSERT INTO orders (
        hotel_id,
        order_number,
        table_id,
        waiter_id,
        customer_name,
        customer_phone,
        subtotal,
        tax_amount,
        service_charge,
        discount_amount,
        total_amount,
        status,
        payment_status,
        payment_method,
        paid_amount,
        special_instructions,
        kitchen_notes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        'pending','pending',
        $12,$13,$14,$15
      )
      RETURNING *
      `,
      [
        hotelId,
        orderNumber,
        table_id || null,
        waiter_id || null,
        customer_name || null,
        customer_phone || null,
        subtotal,
        Number(tax_amount || 0),
        Number(service_charge || 0),
        Number(discount_amount || 0),
        totalAmount,
        payment_method,
        Number(paid_amount || 0),
        special_instructions || null,
        kitchen_notes || null,
      ]
    );

    const orderId = result.rows[0].id;

    for (const item of orderItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,'pending')
        `,
        [orderId, item.id, item.name, item.qty, item.price, item.total]
      );
    }

    // ===============================
    // ✅ CHANGE TABLE STATUS
    // available -> occupied
    // ===============================
    if (table_id) {
      await client.query(
        `
        UPDATE hotel_tables
        SET
          status = 'occupied',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND hotel_id = $2
        `,
        [table_id, hotelId]
      );
    }

    await client.query("COMMIT");

    const completeOrder = await getOrderWithItems(orderId);

    // ===============================
    // 🔥 NOTIFY KITCHEN ON CREATE
    // ===============================
    const kitchenUsers = await db.query(
      `
      SELECT id
      FROM users
      WHERE hotel_id = $1
        AND role = 'kitchen'
        AND is_active = true
      `,
      [hotelId]
    );

    const kitchenIds = kitchenUsers.rows.map((u) => u.id);

    if (kitchenIds.length > 0) {
      await NotificationService.sendToUsers(kitchenIds, {
        title: "New Order 🔥",
        body: `Order ${completeOrder.order_number} sent to kitchen`,
        data: {
          orderId,
          type: "order_created",
        },
      });
    }

    // socket
    req.app.get("io").to(`hotel:${hotelId}`).emit("order:new", completeOrder);

    // optional table socket update
    if (table_id) {
      req.app.get("io").to(`hotel:${hotelId}`).emit("table:updated", {
        table_id,
        status: "occupied",
      });
    }

    return res.status(201).json({
      success: true,
      order: completeOrder,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/* =========================
   UPDATE ORDER
   PUT /api/hotel/orders/:id
========================= */
exports.updateOrder = async (req, res, next) => {
  const client = await db.getClient();

  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const {
      table_id,
      waiter_id,
      customer_name,
      customer_phone,
      special_instructions,
      kitchen_notes,
      items,
      tax_amount,
      service_charge,
      discount_amount,
      status,
    } = req.body;

    // reject payment fields here
    const forbiddenPaymentFields = ["payment_method", "paid_amount", "payment_status", "amount"];
    const hasPaymentFields = forbiddenPaymentFields.some(
      (field) => Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (hasPaymentFields) {
      return errorResponse(
        res,
        400,
        "Payment updates are not allowed in updateOrder. Use the payment API."
      );
    }

    const existing = await client.query(
      `SELECT id, table_id, status, subtotal, tax_amount, service_charge, discount_amount, total_amount
       FROM orders
       WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Order not found");
    }

    const existingOrder = existing.rows[0];
    const oldTableId = existingOrder.table_id;
    const orderStatus = existingOrder.status;

    if (orderStatus === "completed") {
      return errorResponse(res, 400, "Cannot update a completed order");
    }

    if (orderStatus === "cancelled") {
      const allowedUpdates = ["status"];
      const requestedUpdates = Object.keys(req.body);
      const hasInvalidUpdate = requestedUpdates.some(
        (update) => !allowedUpdates.includes(update)
      );

      if (hasInvalidUpdate) {
        return errorResponse(
          res,
          400,
          "Cancelled orders can only update status"
        );
      }
    }

    await client.query("BEGIN");

    let newSubtotal = parseFloat(existingOrder.subtotal || 0);
    let newTaxAmount = parseFloat(existingOrder.tax_amount || 0);
    let newServiceCharge = parseFloat(existingOrder.service_charge || 0);
    let newDiscountAmount = parseFloat(existingOrder.discount_amount || 0);
    let newTotalAmount = parseFloat(existingOrder.total_amount || 0);

    if (items && Array.isArray(items) && orderStatus !== "cancelled") {
      await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);

      newSubtotal = 0;

      for (const item of items) {
        const {
          menu_item_id,
          quantity,
          unit_price,
          special_instructions: itemInstructions,
        } = item;

        if (!menu_item_id || !quantity || quantity <= 0) {
          await client.query("ROLLBACK");
          return errorResponse(res, 400, "Invalid menu item or quantity");
        }

        const menuCheck = await client.query(
          `SELECT id, price, name
           FROM menu_items
           WHERE id = $1 AND hotel_id = $2 AND is_available = true`,
          [menu_item_id, hotelId]
        );

        if (menuCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return errorResponse(
            res,
            404,
            `Menu item ${menu_item_id} not found or unavailable`
          );
        }

        const itemPrice = unit_price || parseFloat(menuCheck.rows[0].price);
        const itemTotalPrice = itemPrice * quantity;
        newSubtotal += itemTotalPrice;

        await client.query(
          `
          INSERT INTO order_items (
            order_id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          `,
          [
            id,
            menu_item_id,
            menuCheck.rows[0].name,
            quantity,
            itemPrice,
            itemTotalPrice,
            itemInstructions || null,
          ]
        );
      }
    }

    if (tax_amount !== undefined && orderStatus !== "cancelled") {
      newTaxAmount = parseFloat(tax_amount) || 0;
      if (newTaxAmount < 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Tax amount cannot be negative");
      }
    }

    if (service_charge !== undefined && orderStatus !== "cancelled") {
      newServiceCharge = parseFloat(service_charge) || 0;
      if (newServiceCharge < 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Service charge cannot be negative");
      }
    }

    if (discount_amount !== undefined && orderStatus !== "cancelled") {
      newDiscountAmount = parseFloat(discount_amount) || 0;
      if (newDiscountAmount < 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Discount amount cannot be negative");
      }
    }

    if (
      items !== undefined ||
      tax_amount !== undefined ||
      service_charge !== undefined ||
      discount_amount !== undefined
    ) {
      newTotalAmount =
        newSubtotal + newTaxAmount + newServiceCharge - newDiscountAmount;

      if (newTotalAmount < 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Total amount cannot be negative");
      }
    }

    if (table_id !== undefined && orderStatus !== "cancelled") {
      if (table_id === null) {
        if (oldTableId) {
          await client.query(
            `UPDATE hotel_tables
             SET status = 'available', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND hotel_id = $2`,
            [oldTableId, hotelId]
          );
        }
      } else {
        const tableCheck = await client.query(
          `SELECT id, status
           FROM hotel_tables
           WHERE id = $1 AND hotel_id = $2`,
          [table_id, hotelId]
        );

        if (tableCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return errorResponse(res, 404, "Table not found");
        }

        if (tableCheck.rows[0].status === "occupied" && table_id !== oldTableId) {
          await client.query("ROLLBACK");
          return errorResponse(
            res,
            400,
            "Table is already occupied by another order"
          );
        }
      }
    }

    if (waiter_id !== undefined && waiter_id !== null && orderStatus !== "cancelled") {
      const waiterCheck = await client.query(
        `SELECT id
         FROM staff
         WHERE id = $1 AND hotel_id = $2 AND role IN ('waiter', 'manager')`,
        [waiter_id, hotelId]
      );

      if (waiterCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return errorResponse(res, 404, "Waiter not found");
      }
    }

    if (status !== undefined) {
      const validStatuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        await client.query("ROLLBACK");
        return errorResponse(res, 400, "Invalid order status");
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const addUpdateField = (field, value, condition = true) => {
      if (condition && value !== undefined) {
        updateFields.push(`${field} = $${paramCount++}`);
        updateValues.push(value);
      }
    };

    addUpdateField("table_id", table_id !== undefined ? table_id || null : undefined);
    addUpdateField("waiter_id", waiter_id !== undefined ? waiter_id || null : undefined);
    addUpdateField(
      "customer_name",
      customer_name !== undefined ? customer_name || null : undefined
    );
    addUpdateField(
      "customer_phone",
      customer_phone !== undefined ? customer_phone || null : undefined
    );
    addUpdateField(
      "special_instructions",
      special_instructions !== undefined ? special_instructions || null : undefined
    );
    addUpdateField(
      "kitchen_notes",
      kitchen_notes !== undefined ? kitchen_notes || null : undefined
    );

    addUpdateField("subtotal", newSubtotal, items !== undefined);
    addUpdateField(
      "tax_amount",
      newTaxAmount,
      tax_amount !== undefined || items !== undefined
    );
    addUpdateField(
      "service_charge",
      newServiceCharge,
      service_charge !== undefined || items !== undefined
    );
    addUpdateField(
      "discount_amount",
      newDiscountAmount,
      discount_amount !== undefined || items !== undefined
    );
    addUpdateField(
      "total_amount",
      newTotalAmount,
      items !== undefined ||
        tax_amount !== undefined ||
        service_charge !== undefined ||
        discount_amount !== undefined
    );

    addUpdateField("status", status, status !== undefined);

    if (status === "served") {
      addUpdateField("served_at", new Date(), true);
    }

    if (status === "completed") {
      addUpdateField("completed_at", new Date(), true);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateQuery = `
        UPDATE orders
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount} AND hotel_id = $${paramCount + 1}
        RETURNING *
      `;

      updateValues.push(id, hotelId);

      await client.query(updateQuery, updateValues);
    }

    if (table_id !== undefined && table_id !== oldTableId && orderStatus !== "cancelled") {
      if (oldTableId) {
        await client.query(
          `UPDATE hotel_tables
           SET status = 'available', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [oldTableId]
        );
      }

      if (table_id) {
        await client.query(
          `UPDATE hotel_tables
           SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [table_id]
        );
      }
    }

    await client.query("COMMIT");

    const completeOrder = await getOrderWithItems(id);

    return res.json({
      success: true,
      message: "Order updated successfully",
      order: completeOrder,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("Update order error:", error);
    next(error);
  } finally {
    client.release();
  }
};



/* =========================
   UPDATE ORDER STATUS
   PUT /api/hotel/orders/:id/status
========================= */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, "Status is required");
    }

    const valid = [
      "pending",
      "preparing",
      "ready",
      "cancelled",
      "completed",
      "served",
    ];

    if (!valid.includes(status)) {
      return errorResponse(res, 400, "Invalid status");
    }

    // ===============================
    // GET EXISTING ORDER
    // ===============================
    const existing = await db.query(
      `SELECT id, table_id, status 
       FROM orders 
       WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId],
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Order not found");
    }

    const tableId = existing.rows[0].table_id;

    // ===============================
    // UPDATE ORDER
    // ===============================
    const updated = await db.query(
      `
      UPDATE orders
      SET status = $3::order_status_enum,
          served_at = CASE
            WHEN $3::order_status_enum = 'served'::order_status_enum
            THEN CURRENT_TIMESTAMP
            ELSE served_at
          END,
          completed_at = CASE
            WHEN $3::order_status_enum = 'completed'::order_status_enum
            THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [id, hotelId, status],
    );

    // ===============================
    // FREE TABLE (if needed)
    // ===============================
    if (tableId && (status === "completed" || status === "cancelled")) {
      await db.query(
        `
        UPDATE hotel_tables 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND hotel_id = $2
        `,
        [tableId, hotelId],
      );
    }

    // ===============================
    // SOCKET REALTIME UPDATE
    // ===============================
    req.app.get("io").to(`hotel:${hotelId}`).emit("order:status", {
      orderId: existing.rows[0].id,
      status,
    });

    // ===============================
    // FCM NOTIFICATION (STAFF + WAITER)
    // ===============================
    if (status === "ready") {
      console.log("tesr")
      // get table name
      let tableName = "Table";
      if (tableId) {
        const tableInfo = await db.query(
          `SELECT table_name FROM hotel_tables WHERE id = $1 AND hotel_id = $2`,
          [tableId, hotelId],
        );

        tableName = tableInfo.rows[0]?.table_name || "Table";
      }

      // get staff + waiter users
      const users = await db.query(
        `
        SELECT id 
        FROM users 
        WHERE hotel_id = $1 
        AND role ='waiter'
        `,
        [hotelId],
      );

      const userIds = users.rows.map(u => u.id);

      // send notification
      await NotificationService.sendToUsers(userIds, {
        title: "Order Ready",
        body: `Order of ${tableName} is ready to be served`,
        data: {
          orderId: id,
          tableId,
          status: "ready",
        },
      });
    }

    // ===============================
    // RESPONSE
    // ===============================
    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updated.rows[0],
    });

  } catch (error) {
    console.error("Update order status error:", error);
    next(error);
  }
}

/* =========================
   UPDATE PAYMENT STATUS
   PUT /api/hotel/orders/:id/payment
========================= */
exports.updatePaymentStatus = async (req, res, next) => {
  const client = await db.getClient();

  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const { amount, payment_method, payment_status } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return errorResponse(res, 400, "Valid amount is required");
    }

    if (!payment_method) {
      return errorResponse(res, 400, "payment_method is required");
    }

    await client.query("BEGIN");

    // 1. Lock order
    const orderRes = await client.query(
      `SELECT id, total_amount FROM orders WHERE id = $1 AND hotel_id = $2 FOR UPDATE`,
      [id, hotelId]
    );

    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 404, "Order not found");
    }

    const order = orderRes.rows[0];
    const totalAmount = parseFloat(order.total_amount);

    // 2. Insert payment
    await client.query(
      `
      INSERT INTO order_payments (
        order_id,
        hotel_id,
        amount,
        payment_method,
        payment_status
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        id,
        hotelId,
        amount,
        payment_method,
        payment_status || "success",
      ]
    );

    // 3. Recalculate total paid
    const sumRes = await client.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_paid
      FROM order_payments
      WHERE order_id = $1 AND payment_status = 'success'
      `,
      [id]
    );

    const totalPaid = parseFloat(sumRes.rows[0].total_paid);

    // 4. Determine payment status
    let newStatus = "pending";

    if (totalPaid === 0) {
      newStatus = "pending";
    } else if (totalPaid < totalAmount) {
      newStatus = "partial";
    } else {
      newStatus = "paid";
    }

    // 5. Update order summary
    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET
        paid_amount = $3,
        payment_status = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [id, hotelId, totalPaid, newStatus]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Payment added",
      order: updatedOrder.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment error:", error);
    next(error);
  } finally {
    client.release();
  }
};
exports.addOrderPayment = async (req, res, next) => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const { orderId } = req.params;
    const hotelId = req.hotelId;
    const receivedBy = req.user?.id || req.staff?.id || null;

    const {
      amount,
      payment_method,
      payment_status = "success",
      transaction_ref,
      notes,
    } = req.body;

    const paymentAmount = Number(amount);

    if (!orderId) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Order ID is required");
    }

    if (!paymentAmount || paymentAmount <= 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Valid payment amount is required");
    }

    if (!payment_method || !String(payment_method).trim()) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Payment method is required");
    }

    const orderResult = await client.query(
      `
      SELECT
        id,
        hotel_id,
        total_amount,
        paid_amount,
        payment_status,
        status,
        table_id
      FROM orders
      WHERE id = $1 AND hotel_id = $2
      FOR UPDATE
      `,
      [orderId, hotelId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 404, "Order not found");
    }

    const order = orderResult.rows[0];
    const totalAmount = Number(order.total_amount || 0);

    const previousPaymentsResult = await client.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS paid_amount
      FROM order_payments
      WHERE order_id = $1
        AND hotel_id = $2
        AND payment_status = 'success'
      `,
      [orderId, hotelId]
    );

    const previousPaidAmount = Number(
      previousPaymentsResult.rows[0].paid_amount || 0
    );

    const dueBeforePayment = Math.max(totalAmount - previousPaidAmount, 0);
    const newTotalPaid = previousPaidAmount + paymentAmount;

    if (dueBeforePayment <= 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Order is already fully paid");
    }

    if (paymentAmount > dueBeforePayment) {
      await client.query("ROLLBACK");
      return errorResponse(
        res,
        400,
        `Payment exceeds due amount. Due amount is ${dueBeforePayment}`
      );
    }

    const paymentResult = await client.query(
      `
      INSERT INTO order_payments (
        order_id,
        hotel_id,
        amount,
        payment_method,
        payment_status,
        transaction_ref,
        received_by,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        orderId,
        hotelId,
        paymentAmount,
        String(payment_method).trim(),
        payment_status,
        transaction_ref || null,
        receivedBy,
        notes || null,
      ]
    );

    let nextPaymentStatus = "pending";
    let nextOrderStatus = order.status;

    if (newTotalPaid <= 0) {
      nextPaymentStatus = "pending";
    } else if (newTotalPaid < totalAmount) {
      nextPaymentStatus = "partial";
    } else {
      nextPaymentStatus = "paid";
      nextOrderStatus = "completed";
    }

    const updatedOrderResult = await client.query(
      `
      UPDATE orders
      SET
        paid_amount = $1,
        payment_method = $2,
        payment_status = $3,
        status = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND hotel_id = $6
      RETURNING *
      `,
      [
        newTotalPaid,
        String(payment_method).trim(),
        nextPaymentStatus,
        nextOrderStatus,
        orderId,
        hotelId,
      ]
    );

    // ✅ FREE TABLE WHEN ORDER IS FULLY PAID
    if (nextPaymentStatus === "paid" && order.table_id) {
      await client.query(
        `
        UPDATE hotel_tables
        SET status = 'available',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND hotel_id = $2
        `,
        [order.table_id, hotelId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        nextPaymentStatus === "paid"
          ? "Payment completed successfully"
          : "Partial payment added successfully",
      payment: paymentResult.rows[0],
      order: updatedOrderResult.rows[0],
      summary: {
        total_amount: totalAmount,
        previous_paid: previousPaidAmount,
        current_payment: paymentAmount,
        total_paid: newTotalPaid,
        due_before_payment: dueBeforePayment,
        due_amount: Math.max(totalAmount - newTotalPaid, 0),
        payment_status: nextPaymentStatus,
        order_status: nextOrderStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add order payment error:", error);
    next(error);
  } finally {
    client.release();
  }
};
/* =========================
   DELETE ORDER
   DELETE /api/hotel/orders/:id
========================= */
exports.deleteOrder = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const existing = await db.query(
      `SELECT id, status, table_id FROM orders WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId],
    );
    if (existing.rows.length === 0)
      return errorResponse(res, 404, "Order not found");



    const tableId = existing.rows[0].table_id;
    if (tableId) {
      await db.query(
        `UPDATE hotel_tables SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [tableId],
      );
    }

    await db.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
    await db.query(`DELETE FROM orders WHERE id = $1 AND hotel_id = $2`, [id, hotelId]);

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    next(error);
  }
};

/* =========================
   GET ORDER ITEMS
   GET /api/hotel/orders/:orderId/items
========================= */
exports.getOrderItems = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { orderId } = req.params;

    const orderCheck = await db.query(
      `SELECT id FROM orders WHERE id = $1 AND hotel_id = $2`,
      [orderId, hotelId],
    );
    if (orderCheck.rows.length === 0)
      return errorResponse(res, 404, "Order not found");

    const result = await db.query(
      `
      SELECT 
        oi.*,
        mi.item_code,
        mi.name as menu_item_name
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC
      `,
      [orderId],
    );

    res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error("Get order items error:", error);
    next(error);
  }
};

/* =========================
   ADD ORDER ITEM
   POST /api/hotel/orders/:orderId/items
========================= */
exports.addOrderItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { orderId } = req.params;

    const items = Array.isArray(req.body.items)
      ? req.body.items
      : [req.body];

    if (!items.length) {
      return errorResponse(res, 400, "Items are required");
    }

    const orderRes = await db.query(
      `SELECT id, status FROM orders WHERE id = $1 AND hotel_id = $2`,
      [orderId, hotelId]
    );

    if (orderRes.rows.length === 0) {
      return errorResponse(res, 404, "Order not found");
    }

    if (["completed", "cancelled"].includes(orderRes.rows[0].status)) {
      return errorResponse(
        res,
        409,
        "Cannot modify a completed/cancelled order"
      );
    }

    await db.query("BEGIN");

    const insertedItems = [];

    for (const item of items) {
      const {
        menu_item_id,
        quantity = 1,
        special_instructions,
      } = item;

      if (!menu_item_id) {
        await db.query("ROLLBACK");
        return errorResponse(res, 400, "menu_item_id is required");
      }

      if (Number(quantity) <= 0) {
        await db.query("ROLLBACK");
        return errorResponse(res, 400, "quantity must be > 0");
      }

      const itemRes = await db.query(
        `
        SELECT
          id,
          name,
          price,
          is_available
        FROM menu_items
        WHERE id = $1
          AND hotel_id = $2
        LIMIT 1
        `,
        [menu_item_id, hotelId]
      );

      if (itemRes.rows.length === 0) {
        await db.query("ROLLBACK");
        return errorResponse(res, 404, "Menu item not found");
      }

      const menuItem = itemRes.rows[0];

      if (!menuItem.is_available) {
        await db.query("ROLLBACK");
        return errorResponse(res, 409, `${menuItem.name} is not available`);
      }

      const unitPrice = Number(menuItem.price);
      const qty = parseInt(quantity);
      const totalPrice = unitPrice * qty;

      const inserted = await db.query(
        `
        INSERT INTO order_items (
          order_id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'pending'
        )
        RETURNING *
        `,
        [
          orderId,
          menu_item_id,
          menuItem.name,
          qty,
          unitPrice,
          totalPrice,
          special_instructions || null,
        ]
      );

      insertedItems.push(inserted.rows[0]);
    }

    await recalculateOrderTotals(orderId);

    await db.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Order items added successfully",
      items: insertedItems,
      total_items: insertedItems.length,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Add order item error:", error);
    next(error);
  }
};
/* =========================
   UPDATE ORDER ITEM
   PUT /api/hotel/orders/items/:itemId
========================= */
exports.updateOrderItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { itemId } = req.params;
    const { quantity, status, special_instructions } = req.body;

    const existing = await db.query(
      `
      SELECT oi.*, o.hotel_id, o.status as order_status, o.id as order_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = $1
      `,
      [itemId],
    );

    if (existing.rows.length === 0)
      return errorResponse(res, 404, "Order item not found");
    if (existing.rows[0].hotel_id !== hotelId)
      return errorResponse(res, 403, "Forbidden");

    if (["completed", "cancelled"].includes(existing.rows[0].order_status)) {
      return errorResponse(
        res,
        409,
        "Cannot modify items of a completed/cancelled order",
      );
    }

    if (quantity !== undefined && Number(quantity) <= 0) {
      return errorResponse(res, 400, "quantity must be > 0");
    }

    const validItemStatuses = [
      "pending",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ];
    if (
      status !== undefined &&
      status !== null &&
      !validItemStatuses.includes(status)
    ) {
      return errorResponse(res, 400, "Invalid item status");
    }

    await db.query('BEGIN');

    let newTotalPrice = null;
    if (quantity !== undefined) {
      newTotalPrice = parseFloat(existing.rows[0].unit_price) * parseInt(quantity);
    }

    const updated = await db.query(
      `
      UPDATE order_items
      SET
        quantity = COALESCE($2, quantity),
        total_price = COALESCE($3, total_price),
        status = COALESCE($4, status),
        special_instructions = COALESCE($5, special_instructions)
      WHERE id = $1
      RETURNING *
      `,
      [
        itemId,
        quantity !== undefined ? parseInt(quantity) : null,
        newTotalPrice,
        status !== undefined ? status : null,
        special_instructions !== undefined ? special_instructions : null,
      ],
    );

    await recalculateOrderTotals(existing.rows[0].order_id);

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Order item updated successfully",
      item: updated.rows[0],
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Update order item error:", error);
    next(error);
  }
};

/* =========================
   DELETE ORDER ITEM
   DELETE /api/hotel/orders/items/:itemId
========================= */
exports.deleteOrderItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { itemId } = req.params;

    const existing = await db.query(
      `
      SELECT oi.id, oi.order_id, o.hotel_id, o.status as order_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = $1
      `,
      [itemId],
    );

    if (existing.rows.length === 0)
      return errorResponse(res, 404, "Order item not found");
    if (existing.rows[0].hotel_id !== hotelId)
      return errorResponse(res, 403, "Forbidden");

    if (["completed", "cancelled"].includes(existing.rows[0].order_status)) {
      return errorResponse(
        res,
        409,
        "Cannot modify items of a completed/cancelled order",
      );
    }

    await db.query('BEGIN');

    await db.query(`DELETE FROM order_items WHERE id = $1`, [itemId]);
    
    await recalculateOrderTotals(existing.rows[0].order_id);

    await db.query('COMMIT');

    res.json({ success: true, message: "Order item deleted successfully" });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Delete order item error:", error);
    next(error);
  }
};

/* =========================
   GET KITCHEN ORDERS
   GET /api/hotel/kitchen/orders
========================= */
exports.getKitchenOrders = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { status, limit = 20 } = req.query;

    const statuses = status ? [status] : ["confirmed", "preparing", "ready"];

    const result = await db.query(
      `
      SELECT
        o.id as order_id,
        o.order_number,
        o.status as order_status,
        o.created_at,
        t.table_number,
        COUNT(oi.id)::int as items_count,
        COUNT(CASE WHEN oi.status IN ('pending','preparing') THEN 1 END)::int as pending_items
      FROM orders o
      LEFT JOIN hotel_tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.hotel_id = $1
        AND o.status = ANY($2)
        AND DATE(o.created_at) = CURRENT_DATE
      GROUP BY o.id, t.table_number
      ORDER BY o.created_at ASC
      LIMIT $3
      `,
      [hotelId, statuses, parseInt(limit)],
    );

    res.json({
      success: true,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Get kitchen orders error:", error);
    next(error);
  }
};

/* =========================
   UPDATE KITCHEN ITEM STATUS
   PUT /api/hotel/kitchen/orders/:orderId/items/:itemId/status
========================= */
// exports.updateKitchenItemStatus = async (req, res, next) => {
//   try {
//     const hotelId = req.hotelId;
//     const { orderId, itemId } = req.params;
//     const { status, prepared_by } = req.body;

//     if (!status) return errorResponse(res, 400, "Status is required");

//     const validItemStatuses = [
//       "pending",
//       "preparing",
//       "ready",
//       "served",
//       "cancelled",
//     ];
//     if (!validItemStatuses.includes(status)) {
//       return errorResponse(res, 400, "Invalid item status");
//     }

//     const orderCheck = await db.query(
//       `SELECT id FROM orders WHERE id = $1 AND hotel_id = $2`,
//       [orderId, hotelId],
//     );
//     if (orderCheck.rows.length === 0)
//       return errorResponse(res, 404, "Order not found");

//     const existing = await db.query(
//       `SELECT id, status FROM order_items WHERE id = $1 AND order_id = $2`,
//       [itemId, orderId],
//     );
//     if (existing.rows.length === 0)
//       return errorResponse(res, 404, "Order item not found");

//     if (prepared_by) {
//       const staffCheck = await db.query(
//         `SELECT id FROM staff WHERE id = $1 AND hotel_id = $2`,
//         [prepared_by, hotelId],
//       );
//       if (staffCheck.rows.length === 0)
//         return errorResponse(res, 404, "Staff not found");
//     }

//     const updated = await db.query(
//       `
//       UPDATE order_items
//       SET
//         status = $1,
//         prepared_by = COALESCE($2, prepared_by),
//         prepared_at = CASE WHEN $1 IN ('preparing','ready') THEN CURRENT_TIMESTAMP ELSE prepared_at END,
//         served_at = CASE WHEN $1 = 'served' THEN CURRENT_TIMESTAMP ELSE served_at END
//       WHERE id = $3 AND order_id = $4
//       RETURNING *
//       `,
//       [status, prepared_by || null, itemId, orderId],
//     );

//     res.json({
//       success: true,
//       message: "Kitchen item status updated successfully",
//       item: updated.rows[0],
//     });
//   } catch (error) {
//     console.error("Update kitchen item status error:", error);
//     next(error);
//   }
// };
exports.getAnalytics = async (req, res, next) => {
  try {
    const hotelId = req.hotelId || req.hotel?.id;
    const range = req.query.range || "today";

    if (!hotelId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const rangeDaysMap = {
      today: 1,
      week: 7,
      month: 30,
      year: 365,
    };

    const rangeDays = rangeDaysMap[range] || 1;

    // ===============================
    // ORDER SUMMARY
    // ===============================
    const summary = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS revenue,
        COALESCE(SUM(paid_amount) FILTER (WHERE status != 'cancelled'), 0) AS paid_revenue,
        COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE status != 'cancelled'), 0) AS due_amount,

        COUNT(*) AS orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'served')) AS active_orders,

        COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
        COUNT(*) FILTER (WHERE payment_status = 'partial') AS partial_orders,
        COUNT(*) FILTER (WHERE payment_status = 'pending') AS unpaid_orders,
        COUNT(*) FILTER (WHERE payment_status = 'refunded') AS refunded_orders
      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // PROFIT ESTIMATE
    // ===============================
    const profit = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled') * 0.35, 0) AS cost,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled') * 0.65, 0) AS profit
      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // REVENUE CHART
    // ===============================
    const revenueChart = await db.query(
      `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS label,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS revenue,
        COALESCE(SUM(paid_amount) FILTER (WHERE status != 'cancelled'), 0) AS paid_revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY label
      ORDER BY label ASC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // ORDER STATUS
    // ===============================
    const orderStatus = await db.query(
      `
      SELECT 
        status,
        COUNT(*) AS value
      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY status
      ORDER BY value DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // PAYMENT STATUS
    // ===============================
    const paymentStatus = await db.query(
      `
      SELECT 
        payment_status AS status,
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS total_amount,
        COALESCE(SUM(paid_amount), 0) AS paid_amount
      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY payment_status
      ORDER BY orders DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // ORDERS THROUGH PAYMENT METHOD
    // Uses orders.payment_method from your schema
    // ===============================
    const ordersByPaymentMethod = await db.query(
      `
      SELECT
        COALESCE(payment_method, 'unknown') AS payment_method,

        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status != 'cancelled') AS valid_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,

        COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
        COUNT(*) FILTER (WHERE payment_status = 'partial') AS partial_orders,
        COUNT(*) FILTER (WHERE payment_status = 'pending') AS pending_orders,
        COUNT(*) FILTER (WHERE payment_status = 'refunded') AS refunded_orders,

        COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS total_amount,
        COALESCE(SUM(paid_amount) FILTER (WHERE status != 'cancelled'), 0) AS paid_amount,
        COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE status != 'cancelled'), 0) AS due_amount,

        CASE
          WHEN COUNT(*) FILTER (WHERE status != 'cancelled' AND payment_status IN ('paid', 'partial')) > 0
            THEN 'working'
          WHEN COUNT(*) FILTER (WHERE status != 'cancelled') > 0
            THEN 'used_but_unpaid'
          ELSE 'not_used'
        END AS method_status

      FROM orders
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY payment_method
      ORDER BY paid_amount DESC, total_orders DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // SUBSCRIPTION / GATEWAY PAYMENTS
    // Uses payments table from your schema
    // ===============================
    const gatewayPayments = await db.query(
      `
      SELECT
        payment_method,
        provider,
        status,

        COUNT(*) AS transactions,
        COALESCE(SUM(amount), 0) AS amount,
        COALESCE(SUM(tax_amount), 0) AS tax_amount,
        COALESCE(SUM(total_amount), 0) AS total_amount,

        COUNT(*) FILTER (WHERE status = 'paid') AS paid_transactions,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_transactions,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_transactions,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_transactions,
        COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_transactions,

        CASE
          WHEN COUNT(*) FILTER (WHERE status = 'paid') > 0 THEN 'working'
          WHEN COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled', 'expired')) > 0 THEN 'has_failed_payments'
          WHEN COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) > 0 THEN 'pending'
          ELSE 'not_used'
        END AS gateway_status

      FROM payments
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY payment_method, provider, status
      ORDER BY total_amount DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // SUBSCRIPTION INVOICES
    // ===============================
    const subscriptionInvoices = await db.query(
      `
      SELECT
        status,
        payment_method,
        COUNT(*) AS invoices,
        COALESCE(SUM(total_amount), 0) AS total_amount,
        COALESCE(SUM(amount), 0) AS amount,
        COALESCE(SUM(tax_amount), 0) AS tax_amount
      FROM subscription_invoices
      WHERE hotel_id = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY status, payment_method
      ORDER BY total_amount DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // STAFF PERFORMANCE
    // ===============================
    const staff = await db.query(
      `
      SELECT 
        u.id,
        u.full_name AS name,
        u.role,
        u.staff_code,

        COUNT(o.id) AS orders,
        COUNT(o.id) FILTER (WHERE o.status = 'completed') AS completed_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,

        COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) AS revenue,
        COALESCE(SUM(o.paid_amount) FILTER (WHERE o.status != 'cancelled'), 0) AS collected_amount

      FROM users u
      LEFT JOIN orders o 
        ON o.waiter_id = u.id
        AND o.hotel_id = u.hotel_id
        AND o.created_at >= NOW() - ($2 * INTERVAL '1 day')

      WHERE u.hotel_id = $1
        AND u.role IN ('waiter', 'manager', 'receptionist', 'billing')
        AND u.is_active = true

      GROUP BY u.id, u.full_name, u.role, u.staff_code
      ORDER BY collected_amount DESC, orders DESC
      `,
      [hotelId, rangeDays]
    );

    // ===============================
    // TOP ITEMS
    // ===============================
    const topItems = await db.query(
      `
      SELECT
        oi.item_name,
        COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
        COALESCE(SUM(oi.total_price), 0) AS revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.hotel_id = $1
        AND o.created_at >= NOW() - ($2 * INTERVAL '1 day')
        AND o.status != 'cancelled'
        AND oi.status != 'cancelled'
      GROUP BY oi.item_name
      ORDER BY quantity_sold DESC, revenue DESC
      LIMIT 10
      `,
      [hotelId, rangeDays]
    );

    const row = summary.rows[0];

    const paymentMethods = ordersByPaymentMethod.rows;
    const workingPaymentMethods = paymentMethods.filter(
      (item) => item.method_status === "working"
    );

    const topPaymentMethod = paymentMethods[0] || null;

    return res.json({
      success: true,
      range,

      totalRevenue: Number(row.revenue || 0),
      paidRevenue: Number(row.paid_revenue || 0),
      dueAmount: Number(row.due_amount || 0),

      totalOrders: Number(row.orders || 0),
      activeOrders: Number(row.active_orders || 0),
      completed: Number(row.completed || 0),
      cancelled: Number(row.cancelled || 0),

      paidOrders: Number(row.paid_orders || 0),
      partialOrders: Number(row.partial_orders || 0),
      unpaidOrders: Number(row.unpaid_orders || 0),
      refundedOrders: Number(row.refunded_orders || 0),

      profit: Number(profit.rows[0].profit || 0),
      estimatedCost: Number(profit.rows[0].cost || 0),

      revenueChart: revenueChart.rows,
      orderStatus: orderStatus.rows,
      paymentStatus: paymentStatus.rows,

      paymentSummary: {
        totalMethodsUsed: paymentMethods.length,
        workingMethods: workingPaymentMethods.length,
        topPaymentMethod,
      },

      ordersByPaymentMethod: paymentMethods,
      gatewayPayments: gatewayPayments.rows,
      subscriptionInvoices: subscriptionInvoices.rows,

      staff: staff.rows,
      topItems: topItems.rows,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    next(error);
  }
};
/* =========================
   HELPER FUNCTIONS
========================= */

async function generateOrderNumber(hotelId) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const result = await db.query(
    `SELECT COUNT(*) as count FROM orders 
     WHERE hotel_id = $1 AND DATE(created_at) = CURRENT_DATE`,
    [hotelId]
  );
  
  const count = parseInt(result.rows[0].count) + 1;
  const sequence = count.toString().padStart(4, '0');
  
  return `ORD-${dateStr}-${sequence}`;
}

async function getOrderWithItems(orderId) {
  const orderResult = await db.query(
    `
    SELECT 
      o.*,
      ht.table_number
    FROM orders o
    LEFT JOIN hotel_tables ht ON o.table_id = ht.id
    WHERE o.id = $1
    `,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await db.query(
    `
    SELECT 
      oi.*,
      mi.name,
      mi.category_id,
      mi.price AS current_price
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
    `,
    [orderId]
  );

  const order = orderResult.rows[0];
  order.order_items = itemsResult.rows;

  return order;
}
async function recalculateOrderTotals(orderId) {
  const itemsResult = await db.query(
    `
    SELECT SUM(total_price) as subtotal
    FROM order_items
    WHERE order_id = $1
    `,
    [orderId],
  );
  
  const subtotal = parseFloat(itemsResult.rows[0].subtotal) || 0;
  
  const orderResult = await db.query(
    `
    SELECT tax_amount, service_charge, discount_amount
    FROM orders
    WHERE id = $1
    `,
    [orderId],
  );
  
  if (orderResult.rows.length > 0) {
    const order = orderResult.rows[0];
    const taxAmount = parseFloat(order.tax_amount) || 0;
    const serviceCharge = parseFloat(order.service_charge) || 0;
    const discountAmount = parseFloat(order.discount_amount) || 0;
    const totalAmount = subtotal + taxAmount + serviceCharge - discountAmount;
    
    await db.query(
      `
      UPDATE orders
      SET subtotal = $1, total_amount = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [subtotal, totalAmount, orderId],
    );
  }
}


