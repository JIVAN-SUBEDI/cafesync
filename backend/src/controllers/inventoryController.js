const db = require("../config/database.js");
const { errorResponse } = require("../utils/helpers.js");

/* =========================
   GET ALL INVENTORY ITEMS
   GET /api/hotel/inventory
========================= */
exports.getAllInventory = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { 
      category_id, 
      status, 
      low_stock,
      expiring_soon,
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        i.id,
        i.item_code,
        i.item_name,
        i.description,
        ic.name as category_name,
        ic.id as category_id,
        i.current_quantity,
        i.min_quantity,
        i.max_quantity,
        i.unit,
        i.unit_cost,
        i.total_value,
        i.supplier_name,
        i.supplier_contact,
        i.last_purchased_date,
        i.status,
        i.is_active,
        i.location,
        i.barcode,
        i.expiry_date,
        i.daily_consumption_avg,
        i.monthly_consumption_avg,
        i.last_consumption_date,
        i.created_at,
        i.updated_at,
        ROUND(i.current_quantity / NULLIF(i.daily_consumption_avg, 0), 1) as days_of_stock_remaining,
        ROUND((i.current_quantity - i.min_quantity) / NULLIF(i.daily_consumption_avg, 0), 1) as days_until_reorder
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.hotel_id = $1 AND i.is_active = true
    `;
    
    let countQuery = `SELECT COUNT(*) FROM inventory WHERE hotel_id = $1 AND is_active = true`;
    const params = [hotelId];
    const countParams = [hotelId];
    let paramCount = 1;
    let countParamCount = 1;
    
    if (category_id) {
      paramCount++;
      countParamCount++;
      query += ` AND i.category_id = $${paramCount}`;
      countQuery += ` AND category_id = $${countParamCount}`;
      params.push(category_id);
      countParams.push(category_id);
    }
    
    if (status) {
      paramCount++;
      countParamCount++;
      query += ` AND i.status = $${paramCount}`;
      countQuery += ` AND status = $${countParamCount}`;
      params.push(status);
      countParams.push(status);
    }
    
    if (low_stock === 'true') {
      query += ` AND i.current_quantity <= i.min_quantity`;
      countQuery += ` AND current_quantity <= min_quantity`;
    }
    
    if (expiring_soon === 'true') {
      query += ` AND i.expiry_date IS NOT NULL AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
      countQuery += ` AND expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
    }
    
    if (search) {
      paramCount++;
      countParamCount++;
      query += ` AND (i.item_name ILIKE $${paramCount} OR i.item_code ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
      countQuery += ` AND (item_name ILIKE $${countParamCount} OR item_code ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY i.current_quantity / NULLIF(i.min_quantity, 1) ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);
    
    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    const inventory = result.rows.map(item => ({
      id: item.id,
      item_code: item.item_code,
      name: item.item_name,
      description: item.description,
      category_id: item.category_id,
      category_name: item.category_name,
      current_quantity: parseFloat(item.current_quantity),
      min_quantity: parseFloat(item.min_quantity),
      max_quantity: item.max_quantity ? parseFloat(item.max_quantity) : null,
      unit: item.unit,
      unit_cost: parseFloat(item.unit_cost) || 0,
      total_value: parseFloat(item.total_value) || 0,
      supplier_name: item.supplier_name,
      supplier_contact: item.supplier_contact,
      last_purchased_date: item.last_purchased_date,
      status: item.status,
      location: item.location,
      barcode: item.barcode,
      expiry_date: item.expiry_date,
      daily_consumption: parseFloat(item.daily_consumption_avg) || 0,
      monthly_consumption: parseFloat(item.monthly_consumption_avg) || 0,
      last_consumption_date: item.last_consumption_date,
      days_of_stock: item.days_of_stock_remaining,
      days_until_reorder: item.days_until_reorder,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    // Get inventory statistics
    const statsQuery = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(total_value) as total_value,
        SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) as expiring_soon_items,
        SUM(CASE WHEN current_quantity > COALESCE(max_quantity, min_quantity * 3) THEN 1 ELSE 0 END) as over_stock_items
      FROM inventory 
      WHERE hotel_id = $1 AND is_active = true
    `, [hotelId]);
    
    const stats = statsQuery.rows[0];
    
    // Get category statistics
    const categoryStatsQuery = await db.query(`
      SELECT 
        ic.name as category_name,
        COUNT(i.id) as item_count,
        SUM(i.total_value) as category_value,
        SUM(CASE WHEN i.status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.hotel_id = $1 AND i.is_active = true
      GROUP BY ic.name
      ORDER BY category_value DESC
    `, [hotelId]);
    
    res.json({
      success: true,
      inventory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: totalPages
      },
      statistics: {
        total_items: parseInt(stats.total_items) || 0,
        total_value: parseFloat(stats.total_value) || 0,
        low_stock_items: parseInt(stats.low_stock_items) || 0,
        out_of_stock_items: parseInt(stats.out_of_stock_items) || 0,
        expiring_soon_items: parseInt(stats.expiring_soon_items) || 0,
        over_stock_items: parseInt(stats.over_stock_items) || 0
      },
      category_statistics: categoryStatsQuery.rows.map(cat => ({
        category: cat.category_name,
        item_count: parseInt(cat.item_count),
        total_value: parseFloat(cat.category_value),
        low_stock_count: parseInt(cat.low_stock_count)
      }))
    });
    
  } catch (error) {
    console.error("Get inventory error:", error);
    next(error);
  }
};

/* =========================
   GET LOW STOCK ITEMS
   GET /api/hotel/inventory/low-stock
========================= */
exports.getLowStock = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const limit = parseInt(req.query.limit) || 10;
    
    const query = `
      SELECT 
        i.id,
        i.item_code,
        i.item_name,
        ic.name as category_name,
        i.current_quantity,
        i.min_quantity,
        i.unit,
        i.unit_cost,
        i.total_value,
        i.status,
        i.supplier_name,
        i.last_purchased_date,
        i.daily_consumption_avg,
        ROUND(i.current_quantity / NULLIF(i.daily_consumption_avg, 0), 1) as days_of_stock_remaining,
        ROUND((i.current_quantity - i.min_quantity) / NULLIF(i.daily_consumption_avg, 0), 1) as days_until_reorder
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.hotel_id = $1 
        AND i.is_active = true
        AND i.current_quantity <= i.min_quantity
      ORDER BY i.current_quantity / NULLIF(i.min_quantity, 1) ASC
      LIMIT $2
    `;
    
    const result = await db.query(query, [hotelId, limit]);
    
    const inventory = result.rows.map(item => ({
      id: item.id,
      item_code: item.item_code,
      name: item.item_name,
      category: item.category_name,
      current_quantity: parseFloat(item.current_quantity),
      min_quantity: parseFloat(item.min_quantity),
      unit: item.unit,
      unit_cost: parseFloat(item.unit_cost) || 0,
      total_value: parseFloat(item.total_value) || 0,
      status: item.status,
      supplier_name: item.supplier_name,
      last_purchased_date: item.last_purchased_date,
      daily_consumption: parseFloat(item.daily_consumption_avg) || 0,
      days_of_stock: item.days_of_stock_remaining,
      days_until_reorder: item.days_until_reorder
    }));
    
    // Get count for statistics
    const countQuery = await db.query(`
      SELECT COUNT(*) as low_stock_count
      FROM inventory 
      WHERE hotel_id = $1 
        AND is_active = true
        AND current_quantity <= min_quantity
    `, [hotelId]);
    
    res.json({
      success: true,
      inventory,
      statistics: {
        low_stock_count: parseInt(countQuery.rows[0].low_stock_count) || 0
      }
    });
    
  } catch (error) {
    console.error("Get low stock error:", error);
    next(error);
  }
};

/* =========================
   CREATE INVENTORY TRANSACTION
   POST /api/hotel/inventory/transactions
========================= */
exports.createTransaction = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const staffId = req.staff?.id; // Assuming staff info is in request
    const {
      inventory_id,
      transaction_type,
      quantity_change,
      unit_price,
      reference_number,
      order_id,
      notes,
      reason
    } = req.body;
    
    // Validate required fields
    if (!inventory_id || !transaction_type || !quantity_change) {
      return errorResponse(res, 400, "Inventory ID, transaction type, and quantity change are required");
    }
    
    // Validate transaction type
    const validTypes = ['purchase', 'sale', 'adjustment', 'wastage', 'transfer', 'production', 'consumption'];
    if (!validTypes.includes(transaction_type)) {
      return errorResponse(res, 400, "Invalid transaction type");
    }
    
    // Check if inventory item exists and belongs to hotel
    const inventoryCheck = await db.query(
      `SELECT id, current_quantity, min_quantity FROM inventory WHERE id = $1 AND hotel_id = $2`,
      [inventory_id, hotelId]
    );
    
    if (inventoryCheck.rows.length === 0) {
      return errorResponse(res, 404, "Inventory item not found");
    }
    
    // Check if order exists if provided
    if (order_id) {
      const orderCheck = await db.query(
        `SELECT id FROM orders WHERE id = $1 AND hotel_id = $2`,
        [order_id, hotelId]
      );
      
      if (orderCheck.rows.length === 0) {
        return errorResponse(res, 404, "Order not found");
      }
    }
    
    // Create transaction (trigger will handle inventory update)
    const query = `
      INSERT INTO inventory_transactions (
        hotel_id,
        inventory_id,
        transaction_type,
        quantity_change,
        unit_price,
        reference_number,
        order_id,
        staff_id,
        notes,
        reason,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      hotelId,
      inventory_id,
      transaction_type,
      parseFloat(quantity_change),
      unit_price ? parseFloat(unit_price) : null,
      reference_number || null,
      order_id || null,
      staffId || null,
      notes || null,
      reason || null,
      staffId || null
    ];
    
    const result = await db.query(query, values);
    const transaction = result.rows[0];
    
    // Get updated inventory item
    const updatedInventory = await db.query(
      `SELECT 
        i.current_quantity,
        i.status,
        i.total_value
       FROM inventory i
       WHERE i.id = $1`,
      [inventory_id]
    );
    
    res.status(201).json({
      success: true,
      message: "Inventory transaction created successfully",
      transaction: {
        id: transaction.id,
        transaction_type: transaction.transaction_type,
        quantity_change: parseFloat(transaction.quantity_change),
        quantity_before: parseFloat(transaction.quantity_before),
        quantity_after: parseFloat(transaction.quantity_after),
        unit_price: transaction.unit_price ? parseFloat(transaction.unit_price) : null,
        total_price: transaction.total_price ? parseFloat(transaction.total_price) : null,
        reference_number: transaction.reference_number,
        created_at: transaction.created_at
      },
      inventory_update: {
        current_quantity: parseFloat(updatedInventory.rows[0].current_quantity),
        status: updatedInventory.rows[0].status,
        total_value: parseFloat(updatedInventory.rows[0].total_value)
      }
    });
    
  } catch (error) {
    console.error("Create transaction error:", error);
    next(error);
  }
};


/* =========================
   GET EXPIRING SOON ITEMS
   GET /api/hotel/inventory/expiring-soon
========================= */
exports.getExpiringSoon = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;

    const result = await db.query(
      `
      SELECT 
        i.id,
        i.item_code,
        i.item_name,
        ic.name as category_name,
        i.current_quantity,
        i.unit,
        i.expiry_date,
        EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) as days_until_expiry,
        i.unit_cost,
        i.total_value
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.hotel_id = $1
        AND i.is_active = true
        AND i.expiry_date IS NOT NULL
        AND i.expiry_date >= CURRENT_DATE
        AND i.expiry_date <= CURRENT_DATE + ($2 || ' days')::interval
      ORDER BY i.expiry_date ASC
      LIMIT $3
      `,
      [hotelId, days, limit]
    );

    res.json({
      success: true,
      items: result.rows.map(r => ({
        id: r.id,
        item_code: r.item_code,
        name: r.item_name,
        category: r.category_name,
        quantity: parseFloat(r.current_quantity),
        unit: r.unit,
        expiry_date: r.expiry_date,
        days_until_expiry: r.days_until_expiry !== null ? parseInt(r.days_until_expiry) : null,
        unit_cost: parseFloat(r.unit_cost) || 0,
        total_value: parseFloat(r.total_value) || 0,
      })),
    });
  } catch (error) {
    console.error("Get expiring soon error:", error);
    next(error);
  }
};

/* =========================
   GET INVENTORY VALUATION
   GET /api/hotel/inventory/valuation
========================= */
exports.getValuation = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;

    const summary = await db.query(
      `
      SELECT
        COUNT(*)::int as total_items,
        COALESCE(SUM(total_value), 0) as total_value,
        COALESCE(SUM(current_quantity), 0) as total_quantity,
        COALESCE(AVG(unit_cost), 0) as avg_unit_cost
      FROM inventory
      WHERE hotel_id = $1 AND is_active = true
      `,
      [hotelId]
    );

    const byCategory = await db.query(
      `
      SELECT
        ic.id as category_id,
        ic.name as category_name,
        COUNT(i.id)::int as item_count,
        COALESCE(SUM(i.total_value), 0) as category_value
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.hotel_id = $1 AND i.is_active = true
      GROUP BY ic.id, ic.name
      ORDER BY category_value DESC
      `,
      [hotelId]
    );

    res.json({
      success: true,
      summary: {
        total_items: summary.rows[0].total_items,
        total_value: parseFloat(summary.rows[0].total_value) || 0,
        total_quantity: parseFloat(summary.rows[0].total_quantity) || 0,
        avg_unit_cost: parseFloat(summary.rows[0].avg_unit_cost) || 0,
      },
      categories: byCategory.rows.map(r => ({
        category_id: r.category_id,
        category_name: r.category_name || "Uncategorized",
        item_count: r.item_count,
        category_value: parseFloat(r.category_value) || 0,
      })),
    });
  } catch (error) {
    console.error("Get valuation error:", error);
    next(error);
  }
};

/* =========================
   GET INVENTORY ITEM BY ID
   GET /api/hotel/inventory/:id
========================= */
// exports.getInventoryItem = async (req, res, next) => {
//   try {
//     const hotelId = req.hotelId;
//     const { id } = req.params;

//     const result = await db.query(
//       `
//       SELECT
//         i.*,
//         ic.name as category_name
//       FROM inventory i
//       LEFT JOIN inventory_categories ic ON i.category_id = ic.id
//       WHERE i.id = $1 AND i.hotel_id = $2 AND i.is_active = true
//       `,
//       [id, hotelId]
//     );

//     if (result.rows.length === 0) {
//       return errorResponse(res, 404, "Inventory item not found");
//     }

//     const item = result.rows[0];

//     res.json({
//       success: true,
//       item: {
//         id: item.id,
//         item_code: item.item_code,
//         item_name: item.item_name,
//         description: item.description,
//         category_id: item.category_id,
//         category_name: item.category_name,
//         current_quantity: parseFloat(item.current_quantity),
//         min_quantity: parseFloat(item.min_quantity),
//         max_quantity: item.max_quantity ? parseFloat(item.max_quantity) : null,
//         unit: item.unit,
//         unit_cost: parseFloat(item.unit_cost) || 0,
//         total_value: parseFloat(item.total_value) || 0,
//         supplier_name: item.supplier_name,
//         supplier_contact: item.supplier_contact,
//         supplier_price: item.supplier_price ? parseFloat(item.supplier_price) : null,
//         last_purchased_date: item.last_purchased_date,
//         reorder_point: item.reorder_point ? parseFloat(item.reorder_point) : null,
//         status: item.status,
//         location: item.location,
//         barcode: item.barcode,
//         expiry_date: item.expiry_date,
//         daily_consumption_avg: parseFloat(item.daily_consumption_avg) || 0,
//         monthly_consumption_avg: parseFloat(item.monthly_consumption_avg) || 0,
//         last_consumption_date: item.last_consumption_date,
//         created_at: item.created_at,
//         updated_at: item.updated_at,
//       },
//     });
//   } catch (error) {
//     console.error("Get inventory item error:", error);
//     next(error);
//   }
// };

/* =========================
   GET INVENTORY ITEM BY ID
   GET /api/hotel/inventory/:id
========================= */
exports.getInventoryItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    // Validate UUID format before attempting database query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse(res, 400, "Invalid inventory item ID format");
    }

    const result = await db.query(
      `
      SELECT
        i.*,
        ic.name as category_name
      FROM inventory i
      LEFT JOIN inventory_categories ic ON i.category_id = ic.id
      WHERE i.id = $1 AND i.hotel_id = $2 AND i.is_active = true
      `,
      [id, hotelId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Inventory item not found");
    }

    const item = result.rows[0];

    res.json({
      success: true,
      item: {
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        category_id: item.category_id,
        category_name: item.category_name,
        current_quantity: parseFloat(item.current_quantity),
        min_quantity: parseFloat(item.min_quantity),
        max_quantity: item.max_quantity ? parseFloat(item.max_quantity) : null,
        unit: item.unit,
        unit_cost: parseFloat(item.unit_cost) || 0,
        total_value: parseFloat(item.total_value) || 0,
        supplier_name: item.supplier_name,
        supplier_contact: item.supplier_contact,
        supplier_price: item.supplier_price ? parseFloat(item.supplier_price) : null,
        last_purchased_date: item.last_purchased_date,
        reorder_point: item.reorder_point ? parseFloat(item.reorder_point) : null,
        status: item.status,
        location: item.location,
        barcode: item.barcode,
        expiry_date: item.expiry_date,
        daily_consumption_avg: parseFloat(item.daily_consumption_avg) || 0,
        monthly_consumption_avg: parseFloat(item.monthly_consumption_avg) || 0,
        last_consumption_date: item.last_consumption_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    });
  } catch (error) {
    console.error("Get inventory item error:", error);
    next(error);
  }
};

/* =========================
   CREATE INVENTORY ITEM
   POST /api/hotel/inventory
========================= */
exports.createInventoryItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;

    const {
      category_id,
      item_name,
      description,
      current_quantity,
      min_quantity,
      max_quantity,
      unit,
      unit_cost,
      supplier_name,
      supplier_contact,
      supplier_price,
      last_purchased_date,
      reorder_point,
      location,
      barcode,
      expiry_date,
    } = req.body;

    if (!item_name || !unit) {
      return errorResponse(res, 400, "Item name and unit are required");
    }

    if (current_quantity !== undefined && Number(current_quantity) < 0) {
      return errorResponse(res, 400, "Current quantity cannot be negative");
    }

    if (min_quantity !== undefined && Number(min_quantity) < 0) {
      return errorResponse(res, 400, "Min quantity cannot be negative");
    }

    if (unit_cost !== undefined && Number(unit_cost) < 0) {
      return errorResponse(res, 400, "Unit cost cannot be negative");
    }

    // If category_id provided, validate belongs to hotel
    if (category_id) {
      const cat = await db.query(
        `SELECT id FROM inventory_categories WHERE id = $1 AND hotel_id = $2`,
        [category_id, hotelId]
      );
      if (cat.rows.length === 0) {
        return errorResponse(res, 404, "Inventory category not found");
      }
    }

    const result = await db.query(
      `
      INSERT INTO inventory (
        hotel_id,
        category_id,
        item_name,
        description,
        current_quantity,
        min_quantity,
        max_quantity,
        unit,
        unit_cost,
        supplier_name,
        supplier_contact,
        supplier_price,
        last_purchased_date,
        reorder_point,
        location,
        barcode,
        expiry_date,
        is_active
      ) VALUES (
        $1, $2, $3, $4,
        COALESCE($5, 0),
        COALESCE($6, 10),
        $7,
        $8,
        COALESCE($9, 0),
        $10, $11, $12,
        $13, $14,
        $15, $16, $17,
        true
      )
      RETURNING *
      `,
      [
        hotelId,
        category_id || null,
        item_name,
        description || null,
        current_quantity !== undefined ? parseFloat(current_quantity) : null,
        min_quantity !== undefined ? parseFloat(min_quantity) : null,
        max_quantity !== undefined ? parseFloat(max_quantity) : null,
        unit,
        unit_cost !== undefined ? parseFloat(unit_cost) : null,
        supplier_name || null,
        supplier_contact || null,
        supplier_price !== undefined ? parseFloat(supplier_price) : null,
        last_purchased_date || null,
        reorder_point !== undefined ? parseFloat(reorder_point) : null,
        location || null,
        barcode || null,
        expiry_date || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Create inventory item error:", error);
    if (error.code === "23505") {
      return errorResponse(res, 409, "Duplicate inventory item code");
    }
    next(error);
  }
};

/* =========================
   UPDATE INVENTORY ITEM
   PUT /api/hotel/inventory/:id
========================= */
exports.updateInventoryItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const existing = await db.query(
      `SELECT id FROM inventory WHERE id = $1 AND hotel_id = $2 AND is_active = true`,
      [id, hotelId]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Inventory item not found");
    }

    const {
      category_id,
      item_name,
      description,
      min_quantity,
      max_quantity,
      unit,
      unit_cost,
      supplier_name,
      supplier_contact,
      supplier_price,
      last_purchased_date,
      reorder_point,
      location,
      barcode,
      expiry_date,
      is_active,
      status,
    } = req.body;

    if (min_quantity !== undefined && Number(min_quantity) < 0) {
      return errorResponse(res, 400, "Min quantity cannot be negative");
    }
    if (unit_cost !== undefined && Number(unit_cost) < 0) {
      return errorResponse(res, 400, "Unit cost cannot be negative");
    }

    if (category_id) {
      const cat = await db.query(
        `SELECT id FROM inventory_categories WHERE id = $1 AND hotel_id = $2`,
        [category_id, hotelId]
      );
      if (cat.rows.length === 0) {
        return errorResponse(res, 404, "Inventory category not found");
      }
    }

    // status is free text in schema but you probably want to restrict it
    const allowedStatus = ['in_stock', 'low_stock', 'out_of_stock', 'over_stock', 'discontinued'];
    if (status !== undefined && status !== null && !allowedStatus.includes(status)) {
      return errorResponse(res, 400, "Invalid status");
    }

    const updated = await db.query(
      `
      UPDATE inventory
      SET
        category_id = COALESCE($3, category_id),
        item_name = COALESCE($4, item_name),
        description = COALESCE($5, description),
        min_quantity = COALESCE($6, min_quantity),
        max_quantity = COALESCE($7, max_quantity),
        unit = COALESCE($8, unit),
        unit_cost = COALESCE($9, unit_cost),
        supplier_name = COALESCE($10, supplier_name),
        supplier_contact = COALESCE($11, supplier_contact),
        supplier_price = COALESCE($12, supplier_price),
        last_purchased_date = COALESCE($13, last_purchased_date),
        reorder_point = COALESCE($14, reorder_point),
        location = COALESCE($15, location),
        barcode = COALESCE($16, barcode),
        expiry_date = COALESCE($17, expiry_date),
        is_active = COALESCE($18, is_active),
        status = COALESCE($19, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [
        id,
        hotelId,
        category_id || null,
        item_name || null,
        description !== undefined ? description : null,
        min_quantity !== undefined ? parseFloat(min_quantity) : null,
        max_quantity !== undefined ? parseFloat(max_quantity) : null,
        unit || null,
        unit_cost !== undefined ? parseFloat(unit_cost) : null,
        supplier_name || null,
        supplier_contact || null,
        supplier_price !== undefined ? parseFloat(supplier_price) : null,
        last_purchased_date || null,
        reorder_point !== undefined ? parseFloat(reorder_point) : null,
        location || null,
        barcode || null,
        expiry_date || null,
        is_active !== undefined ? is_active : null,
        status !== undefined ? status : null,
      ]
    );

    res.json({
      success: true,
      message: "Inventory item updated successfully",
      item: updated.rows[0],
    });
  } catch (error) {
    console.error("Update inventory item error:", error);
    next(error);
  }
};

/* =========================
   DELETE INVENTORY ITEM (soft delete)
   DELETE /api/hotel/inventory/:id
========================= */
exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE inventory
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING id
      `,
      [id, hotelId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Inventory item not found");
    }

    res.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory item error:", error);
    next(error);
  }
};

/* =========================
   GET INVENTORY TRANSACTIONS
   GET /api/hotel/inventory/transactions/:inventoryId
========================= */
exports.getTransactions = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { inventoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    // verify item belongs to hotel
    const check = await db.query(
      `SELECT id FROM inventory WHERE id = $1 AND hotel_id = $2`,
      [inventoryId, hotelId]
    );
    if (check.rows.length === 0) {
      return errorResponse(res, 404, "Inventory item not found");
    }

    const [tx, count] = await Promise.all([
      db.query(
        `
        SELECT
          it.id,
          it.transaction_type,
          it.transaction_date,
          it.reference_number,
          it.quantity_before,
          it.quantity_change,
          it.quantity_after,
          it.unit_price,
          it.total_price,
          it.order_id,
          it.staff_id,
          it.notes,
          it.reason,
          s.full_name as staff_name
        FROM inventory_transactions it
        LEFT JOIN staff s ON it.staff_id = s.id
        WHERE it.hotel_id = $1 AND it.inventory_id = $2
        ORDER BY it.transaction_date DESC
        LIMIT $3 OFFSET $4
        `,
        [hotelId, inventoryId, parseInt(limit), offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM inventory_transactions WHERE hotel_id = $1 AND inventory_id = $2`,
        [hotelId, inventoryId]
      ),
    ]);

    res.json({
      success: true,
      transactions: tx.rows.map(r => ({
        id: r.id,
        type: r.transaction_type,
        date: r.transaction_date,
        reference_number: r.reference_number,
        quantity_before: parseFloat(r.quantity_before),
        quantity_change: parseFloat(r.quantity_change),
        quantity_after: parseFloat(r.quantity_after),
        unit_price: r.unit_price ? parseFloat(r.unit_price) : null,
        total_price: r.total_price ? parseFloat(r.total_price) : null,
        order_id: r.order_id,
        staff_id: r.staff_id,
        staff_name: r.staff_name,
        notes: r.notes,
        reason: r.reason,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count.rows[0].count),
        total_pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error("Get inventory transactions error:", error);
    next(error);
  }
};

/* =========================
   GET INVENTORY CATEGORIES
   GET /api/hotel/inventory/categories
========================= */
// exports.getCategories = async (req, res, next) => {
//   try {
//     const hotelId = req.hotelId;

//     const result = await db.query(
//       `
//       SELECT
//         ic.id,
//         ic.name,
//         ic.description,
//         ic.parent_category_id,
//         ic.display_order,
//         ic.created_at,
//         ic.updated_at,
//         COUNT(i.id)::int as items_count
//       FROM inventory_categories ic
//       LEFT JOIN inventory i ON i.category_id = ic.id AND i.is_active = true
//       WHERE ic.hotel_id = $1
//       GROUP BY ic.id
//       ORDER BY ic.display_order, ic.name
//       `,
//       [hotelId]
//     );

//     res.json({
//       success: true,
//       categories: result.rows.map(r => ({
//         id: r.id,
//         name: r.name,
//         description: r.description,
//         parent_category_id: r.parent_category_id,
//         display_order: r.display_order,
//         items_count: r.items_count,
//         created_at: r.created_at,
//         updated_at: r.updated_at,
//       })),
//     });
//   } catch (error) {
//     console.error("Get inventory categories error:", error);
//     next(error);
//   }
// };


/* =========================
   GET INVENTORY CATEGORIES
   GET /api/hotel/inventory/categories
========================= */
exports.getCategories = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;

    const result = await db.query(
      `
      SELECT
        ic.id,
        ic.name,
        ic.description,
        ic.parent_category_id,
        ic.display_order,
        ic.created_at,
        ic.updated_at,
        COUNT(i.id)::int as items_count
      FROM inventory_categories ic
      LEFT JOIN inventory i ON i.category_id = ic.id AND i.is_active = true
      WHERE ic.hotel_id = $1
      GROUP BY ic.id
      ORDER BY ic.display_order, ic.name
      `,
      [hotelId]
    );

    res.json({
      success: true,
      categories: result.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        parent_category_id: r.parent_category_id,
        display_order: r.display_order,
        items_count: r.items_count,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get inventory categories error:", error);
    next(error);
  }
};



/* =========================
   CREATE INVENTORY CATEGORY
   POST /api/hotel/inventory/categories
========================= */
exports.createCategory = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { name, description, parent_category_id, display_order } = req.body;

    if (!name) {
      return errorResponse(res, 400, "Category name is required");
    }

    // if parent provided, ensure it belongs to hotel
    if (parent_category_id) {
      const parent = await db.query(
        `SELECT id FROM inventory_categories WHERE id = $1 AND hotel_id = $2`,
        [parent_category_id, hotelId]
      );
      if (parent.rows.length === 0) {
        return errorResponse(res, 404, "Parent category not found");
      }
    }

    // prevent duplicates
    const dup = await db.query(
      `SELECT id FROM inventory_categories WHERE hotel_id = $1 AND LOWER(name) = LOWER($2)`,
      [hotelId, name.trim()]
    );
    if (dup.rows.length > 0) {
      return errorResponse(res, 409, "Category name already exists");
    }

    const result = await db.query(
      `
      INSERT INTO inventory_categories (hotel_id, name, description, parent_category_id, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [hotelId, name.trim(), description || null, parent_category_id || null, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: "Inventory category created successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Create inventory category error:", error);
    if (error.code === "23505") {
      return errorResponse(res, 409, "Category name already exists");
    }
    next(error);
  }
};

/* =========================
   GET INVENTORY ALERTS
   GET /api/hotel/inventory/alerts
========================= */
exports.getAlerts = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { unread, unresolved, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        ia.id,
        ia.alert_type,
        ia.alert_level,
        ia.message,
        ia.is_read,
        ia.is_resolved,
        ia.created_at,
        ia.expires_at,
        ia.resolved_at,
        i.id as inventory_id,
        i.item_code,
        i.item_name,
        s.full_name as resolved_by_name
      FROM inventory_alerts ia
      JOIN inventory i ON ia.inventory_id = i.id
      LEFT JOIN staff s ON ia.resolved_by = s.id
      WHERE ia.hotel_id = $1
        AND ia.expires_at > CURRENT_TIMESTAMP
    `;

    const params = [hotelId];
    let p = 1;

    if (unread === "true") {
      query += ` AND ia.is_read = false`;
    }
    if (unresolved === "true") {
      query += ` AND ia.is_resolved = false`;
    }

    query += ` ORDER BY ia.created_at DESC LIMIT $2 OFFSET $3`;
    params.push(parseInt(limit), offset);

    const [rows, count] = await Promise.all([
      db.query(query, params),
      db.query(
        `
        SELECT COUNT(*) 
        FROM inventory_alerts
        WHERE hotel_id = $1
          AND expires_at > CURRENT_TIMESTAMP
          ${unread === "true" ? "AND is_read = false" : ""}
          ${unresolved === "true" ? "AND is_resolved = false" : ""}
        `,
        [hotelId]
      ),
    ]);

    const total = parseInt(count.rows[0].count);

    res.json({
      success: true,
      alerts: rows.rows.map(r => ({
        id: r.id,
        alert_type: r.alert_type,
        alert_level: r.alert_level,
        message: r.message,
        is_read: r.is_read,
        is_resolved: r.is_resolved,
        created_at: r.created_at,
        expires_at: r.expires_at,
        resolved_at: r.resolved_at,
        inventory: {
          id: r.inventory_id,
          item_code: r.item_code,
          item_name: r.item_name,
        },
        resolved_by: r.resolved_by_name || null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    next(error);
  }
};

/* =========================
   MARK ALERT AS READ
   PUT /api/hotel/inventory/alerts/:id/read
========================= */
exports.markAlertRead = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE inventory_alerts
      SET is_read = true
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [id, hotelId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Alert not found");
    }

    res.json({ success: true, message: "Alert marked as read" });
  } catch (error) {
    console.error("Mark alert read error:", error);
    next(error);
  }
};

/* =========================
   RESOLVE ALERT
   PUT /api/hotel/inventory/alerts/:id/resolve
========================= */
exports.resolveAlert = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const staffId = req.staff?.id || null; // if available
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE inventory_alerts
      SET 
        is_resolved = true,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = COALESCE($3, resolved_by)
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [id, hotelId, staffId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Alert not found");
    }

    res.json({ success: true, message: "Alert resolved" });
  } catch (error) {
    console.error("Resolve alert error:", error);
    next(error);
  }
};
