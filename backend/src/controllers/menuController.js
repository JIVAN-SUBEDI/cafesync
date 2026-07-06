const { error } = require("winston");
const db = require("../config/database.js");
const { image } = require("../utils/cloudinary.js");
const { errorResponse } = require("../utils/helpers.js");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary.js");

/* =========================
   GET ALL MENU CATEGORIES
   GET /api/hotel/menu/categories
========================= */
console.log("menu");
exports.getAllCategories = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;

    const query = `
      SELECT 
        mc.id,
        mc.name,
        mc.description,
        mc.display_order,
        mc.image_url,
        mc.is_active,
        mc.created_at,
        mc.updated_at,
        COUNT(mi.id) AS items_count,
        COUNT(CASE WHEN mi.is_available = true THEN 1 END) AS available_items,
        COALESCE(AVG(mi.price), 0) AS avg_price
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mc.id = mi.category_id
      WHERE mc.hotel_id = $1
      GROUP BY mc.id
      ORDER BY mc.display_order ASC, mc.name ASC
    `;

    const result = await db.query(query, [hotelId]);

    const categories = result.rows.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      display_order: Number(cat.display_order) || 0,
      image_url: cat.image_url,
      is_active: cat.is_active,
      items_count: parseInt(cat.items_count, 10) || 0,
      available_items: parseInt(cat.available_items, 10) || 0,
      avg_price: parseFloat(cat.avg_price) || 0,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    }));

    const statsQuery = await db.query(
      `
      SELECT 
        COUNT(*) AS total_categories,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) AS active_categories,
        (
          SELECT COUNT(DISTINCT category_id)
          FROM menu_items
          WHERE hotel_id = $1 AND category_id IS NOT NULL
        ) AS categories_with_items
      FROM menu_categories
      WHERE hotel_id = $1
      `,
      [hotelId]
    );

    const stats = statsQuery.rows[0];

    return res.json({
      success: true,
      categories,
      statistics: {
        total_categories: parseInt(stats.total_categories, 10) || 0,
        active_categories: parseInt(stats.active_categories, 10) || 0,
        categories_with_items: parseInt(stats.categories_with_items, 10) || 0,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    next(error);
  }
};


exports.createCategory = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    let { name, description, display_order } = req.body;
    let image_url = null;

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/menu/categories/${hotelId}`,
      });
      image_url = uploadedImage.secure_url;
    }
    console.log(']------------------------------------------------------')
    console.log('this is the create category req.body:- ', req.body);
    console.log('this is req file:- ', req.file)

    if(req.file=== undefined) {
      return errorResponse(res, 400, "Image file is required when image_url is set to null");
    }

    const cleanName = typeof name === "string" ? name.trim() : "";

    if (!cleanName) {
      return errorResponse(res, 400, "Category name is required");
    }

    const limitCheck = await db.query(
      `
      SELECT COUNT(*) AS current_count
      FROM menu_categories
      WHERE hotel_id = $1
      `,
      [hotelId]
    );

    const currentCount = parseInt(limitCheck.rows[0].current_count, 10) || 0;

    const duplicateCheck = await db.query(
      `
      SELECT id, name
      FROM menu_categories
      WHERE hotel_id = $1
        AND TRIM(LOWER(name)) = TRIM(LOWER($2))
      LIMIT 1
      `,
      [hotelId, cleanName]
    );

    if (duplicateCheck.rows.length > 0) {
      return errorResponse(res, 409, "Category name already exists");
    }

    const parsedDisplayOrder =
      display_order !== undefined &&
      display_order !== null &&
      display_order !== ""
        ? parseInt(display_order, 10)
        : currentCount + 1;

    const result = await db.query(
      `
      INSERT INTO menu_categories (
        hotel_id,
        name,
        description,
        display_order,
        image_url,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        hotelId,
        cleanName,
        description?.trim?.() || null,
        Number.isNaN(parsedDisplayOrder) ? currentCount + 1 : parsedDisplayOrder,
        image_url,
        true,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Menu category created successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (
      error.code === "23505" &&
      error.constraint === "menu_categories_hotel_id_name_key"
    ) {
      return errorResponse(res, 409, "Category name already exists");
    }

    next(error);
  }
};

// Similarly for updateCategory:
exports.updateCategory = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;
    let { name, description, display_order, is_active, image_url } = req.body;

    const existing = await db.query(
      `
      SELECT id, name, image_url
      FROM menu_categories
      WHERE id = $1 AND hotel_id = $2
      `,
      [id, hotelId]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Category not found");
    }

    const currentCategory = existing.rows[0];

    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/menu/categories/${hotelId}`,
      });
      image_url = uploadedImage.secure_url;
    }

    const cleanName =
      typeof name === "string" ? name.trim() : undefined;

    if (cleanName) {
      const dup = await db.query(
        `
        SELECT id
        FROM menu_categories
        WHERE hotel_id = $1
          AND TRIM(LOWER(name)) = TRIM(LOWER($2))
          AND id <> $3
        LIMIT 1
        `,
        [hotelId, cleanName, id]
      );

      if (dup.rows.length > 0) {
        return errorResponse(res, 409, "Category name already exists");
      }
    }

    const parsedDisplayOrder =
      display_order !== undefined &&
      display_order !== null &&
      display_order !== ""
        ? parseInt(display_order, 10)
        : undefined;

    let finalImageUrl = currentCategory.image_url;

    if (req.file) {
      finalImageUrl = image_url;
    } else if (image_url === "null" || image_url === null) {
      finalImageUrl = null;
    }

    const updated = await db.query(
      `
      UPDATE menu_categories
      SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        display_order = COALESCE($5, display_order),
        image_url = $6,
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [
        id,
        hotelId,
        cleanName || null,
        description !== undefined ? description : null,
        parsedDisplayOrder !== undefined && !Number.isNaN(parsedDisplayOrder)
          ? parsedDisplayOrder
          : null,
        finalImageUrl,
        is_active !== undefined ? is_active : null,
      ]
    );

    return res.json({
      success: true,
      message: "Category updated successfully",
      category: updated.rows[0],
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (
      error.code === "23505" &&
      error.constraint === "menu_categories_hotel_id_name_key"
    ) {
      return errorResponse(res, 409, "Category name already exists");
    }

    next(error);
  }
};

/* =========================
   DELETE MENU CATEGORY
   DELETE /api/hotel/menu/categories/:id
========================= */
exports.deleteCategory = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const cat = await db.query(
      `
      SELECT id, image_url
      FROM menu_categories
      WHERE id = $1 AND hotel_id = $2
      `,
      [id, hotelId]
    );

    if (cat.rows.length === 0) {
      return errorResponse(res, 404, "Category not found");
    }

    await db.query(
      `DELETE FROM menu_categories WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId]
    );

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    next(error);
  }
};

/* =========================
   GET ALL MENU ITEMS
   GET /api/hotel/menu/items
========================= */
exports.getAllMenuItems = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const {
      category_id,
      available_only,
      popular,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        mi.id,
        mi.item_code,
        mi.name,
        mi.description,
        mi.price,
        mi.cost_price,
        mi.tax_rate,
        mi.preparation_time,
        mi.is_available,
        mi.is_popular,
        mi.is_vegetarian,
        mi.dietary_info,
        mi.image_url,
        mi.created_at,
        mi.updated_at,
        mc.id as category_id,
        mc.name as category_name,
        (SELECT COUNT(*) FROM order_items oi 
         WHERE oi.menu_item_id = mi.id 
         AND DATE(oi.created_at) = CURRENT_DATE) as today_orders,
        (SELECT COUNT(*) FROM order_items oi 
         WHERE oi.menu_item_id = mi.id 
         AND DATE(oi.created_at) >= CURRENT_DATE - INTERVAL '7 days') as weekly_orders,
        (SELECT COUNT(*) FROM order_items oi 
         WHERE oi.menu_item_id = mi.id) as total_orders
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.hotel_id = $1
    `;

    let countQuery = `SELECT COUNT(*) FROM menu_items WHERE hotel_id = $1`;
    const params = [hotelId];
    const countParams = [hotelId];
    let paramCount = 1;
    let countParamCount = 1;

    if (category_id) {
      paramCount++;
      countParamCount++;
      query += ` AND mi.category_id = $${paramCount}`;
      countQuery += ` AND category_id = $${countParamCount}`;
      params.push(category_id);
      countParams.push(category_id);
    }

    if (available_only === "true") {
      query += ` AND mi.is_available = true`;
      countQuery += ` AND is_available = true`;
    }

    if (popular === "true") {
      query += ` AND mi.is_popular = true`;
      countQuery += ` AND is_popular = true`;
    }

    if (search) {
      paramCount++;
      countParamCount++;
      query += ` AND (mi.name ILIKE $${paramCount} OR mi.description ILIKE $${paramCount})`;
      countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ` ORDER BY mi.item_code LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const items = result.rows.map((item) => ({
      id: item.id,
      item_code: item.item_code,
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      category_name: item.category_name,
      price: parseFloat(item.price),
      cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
      tax_rate: parseFloat(item.tax_rate),
      preparation_time: item.preparation_time,
      is_available: item.is_available,
      is_popular: item.is_popular,
      is_vegetarian: item.is_vegetarian,
      dietary_info: item.dietary_info,
      image_url: item.image_url,
      today_orders: parseInt(item.today_orders) || 0,
      weekly_orders: parseInt(item.weekly_orders) || 0,
      total_orders: parseInt(item.total_orders) || 0,
      popularity: Math.min(
        100,
        Math.round((parseInt(item.weekly_orders) / 50) * 100),
      ),
      profitability: item.cost_price
        ? Math.round(
            ((parseFloat(item.price) - parseFloat(item.cost_price)) /
              parseFloat(item.cost_price)) *
              100,
          )
        : null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    // Get menu statistics
    const statsQuery = await db.query(
      `
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available_items,
        SUM(CASE WHEN is_popular = true THEN 1 ELSE 0 END) as popular_items,
        AVG(price) as avg_price,
        SUM(CASE WHEN cost_price IS NOT NULL AND cost_price > 0 THEN 1 ELSE 0 END) as items_with_cost
      FROM menu_items 
      WHERE hotel_id = $1
    `,
      [hotelId],
    );

    const stats = statsQuery.rows[0];

    // Get top selling items
    const topSellingQuery = await db.query(
      `
      SELECT 
        mi.id,
        mi.name,
        COUNT(oi.id) as order_count,
        SUM(oi.total_price) as total_revenue
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      WHERE mi.hotel_id = $1
      GROUP BY mi.id
      ORDER BY order_count DESC
      LIMIT 5
    `,
      [hotelId],
    );

    const topSelling = topSellingQuery.rows;

    res.json({
      success: true,
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: totalPages,
      },
      statistics: {
        total_items: parseInt(stats.total_items) || 0,
        available_items: parseInt(stats.available_items) || 0,
        popular_items: parseInt(stats.popular_items) || 0,
        avg_price: parseFloat(stats.avg_price) || 0,
        items_with_cost: parseInt(stats.items_with_cost) || 0,
      },
      top_selling: topSelling.map((item) => ({
        id: item.id,
        name: item.name,
        order_count: parseInt(item.order_count),
        total_revenue: parseFloat(item.total_revenue) || 0,
      })),
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    next(error);
  }
};
exports.getAllMenusForPhone = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const {
      available_only,
      popular,
      search,
    } = req.query;

    let query = `
      SELECT
        mi.id,
        mi.item_code,
        mi.name,
        mi.description,
        mi.price,
        mi.cost_price,
        mi.tax_rate,
        mi.preparation_time,
        mi.is_available,
        mi.is_popular,
        mi.is_vegetarian,
        mi.dietary_info,
        mi.image_url,
        mi.created_at,
        mi.updated_at,
        mc.id AS category_id,
        mc.name AS category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.hotel_id = $1
    `;

    const params = [hotelId];
    let paramCount = 1;

    if (available_only === "true") {
      query += ` AND mi.is_available = true`;
    }

    if (popular === "true") {
      query += ` AND mi.is_popular = true`;
    }

    if (search) {
      paramCount++;
      query += ` AND (
        mi.name ILIKE $${paramCount}
        OR mi.description ILIKE $${paramCount}
        OR mc.name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY mc.name ASC, mi.name ASC`;

    const result = await db.query(query, params);

    const groupedMap = new Map();

    for (const item of result.rows) {
      const categoryId = item.category_id || "uncategorized";
      const categoryName = item.category_name || "Uncategorized";

      if (!groupedMap.has(categoryId)) {
        groupedMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName,
          items: [],
        });
      }

      groupedMap.get(categoryId).items.push({
        id: item.id,
        item_code: item.item_code,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
        tax_rate: item.tax_rate ? parseFloat(item.tax_rate) : 0,
        preparation_time: item.preparation_time,
        is_available: item.is_available,
        is_popular: item.is_popular,
        is_vegetarian: item.is_vegetarian,
        dietary_info: item.dietary_info,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }

    const categories = Array.from(groupedMap.values());

    return res.status(200).json({
      success: true,
      total_categories: categories.length,
      total_items: result.rows.length,
      categories,
    });
  } catch (error) {
    console.error("Get all menus for phone error:", error);
    next(error);
  }
};
/* =========================
   CREATE MENU ITEM
   POST /api/hotel/menu/items
========================= */
exports.createMenuItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const {
      name,
      category_id,
      description,
      price,
      cost_price,
      tax_rate,
      preparation_time,
      is_available,
      is_popular,
      is_vegetarian,
      dietary_info,
    } = req.body;

    let image_url = null;

    // Upload image if provided
    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/menu/items/${hotelId}`,
      });
      image_url = uploadedImage.secure_url;
    }

    // console.log("this is the menu item:- ", req.body);
    if(req.file === undefined) {
      return errorResponse(res, 400, "Image file is required");
    }


    // Validate required fields
    if (!name || !category_id || !price) {
      return errorResponse(res, 400, "Name, category, and price are required");
    }

    if (price <= 0) {
      return errorResponse(res, 400, "Price must be greater than 0");
    }
    console.log("reached");

    // Check menu item limit
    const limitCheck = await db.query(
      `SELECT 
         COUNT(*) as current_count,
         h.max_menu_items_allowed
       FROM menu_items mi
       JOIN hotels h ON mi.hotel_id = h.id
       WHERE mi.hotel_id = $1
       GROUP BY h.max_menu_items_allowed`,
      [hotelId],
    );

    console.log("this is the menu item limitCheck:- ", limitCheck.rows);
    if (limitCheck.rows.length > 0) {
      const current = parseInt(limitCheck.rows[0].current_count);
      const maxAllowed = parseInt(limitCheck.rows[0].max_menu_items_allowed);

      if (current >= maxAllowed) {
        return errorResponse(
          res,
          403,
          `Menu items limit reached. Maximum allowed: ${maxAllowed}`,
        );
      }
    }

    // Check if category exists and belongs to hotel
    const categoryCheck = await db.query(
      `SELECT id FROM menu_categories WHERE id = $1 AND hotel_id = $2`,
      [category_id, hotelId],
    );
    console.log("this is the menu item categoryCheck:- ", categoryCheck.rows);
    if (categoryCheck.rows.length === 0) {
      return errorResponse(res, 404, "Category not found");
    }

    // Check for duplicate item name in same category
    const duplicateCheck = await db.query(
      `SELECT id FROM menu_items WHERE hotel_id = $1 AND category_id = $2 AND LOWER(name) = LOWER($3)`,
      [hotelId, category_id, name],
    );
    console.log("this is the menu item duplicateCheck:- ", duplicateCheck.rows);
    if (duplicateCheck.rows.length > 0) {
      return errorResponse(
        res,
        409,
        "Menu item name already exists in this category",
      );
    }

    // Insert new menu item (item_code will be auto-generated by trigger)
    const query = `
      INSERT INTO menu_items (
        hotel_id,
        category_id,
        name,
        description,
        price,
        cost_price,
        tax_rate,
        preparation_time,
        is_available,
        is_popular,
        is_vegetarian,
        dietary_info,
        image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      hotelId,
      category_id,
      name,
      description || null,
      parseFloat(price),
      cost_price ? parseFloat(cost_price) : null,
      tax_rate ? parseFloat(tax_rate) : 0,
      preparation_time !== undefined && preparation_time !== null
        ? parseInt(preparation_time, 10)
        : null,
      is_available !== undefined ? is_available : true,
      is_popular || false,
      is_vegetarian || false,
      dietary_info || null,
      image_url,
    ];

    const result = await db.query(query, values);
    console.log("this is the menu item result:- ", result.rows[0]);
    const newItem = result.rows[0];
    console.log("this is the menu item newItem:- ", newItem);

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      item: {
        id: newItem.id,
        item_code: newItem.item_code,
        name: newItem.name,
        category_id: newItem.category_id,
        price: parseFloat(newItem.price),
        image_url: newItem.image_url,
        is_available: newItem.is_available,
        created_at: newItem.created_at,
      },
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    if (error.code === "23505") {
      return errorResponse(res, 409, "Duplicate item code");
    }
    next(error);
  }
};

/* =========================
   GET MENU ITEM BY ID
   GET /api/hotel/menu/items/:id
========================= */
exports.getMenuItemById = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        mi.*,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = $1 AND mi.hotel_id = $2
      `,
      [id, hotelId],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Menu item not found");
    }

    const item = result.rows[0];

    res.json({
      success: true,
      item: {
        id: item.id,
        item_code: item.item_code,
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        category_name: item.category_name,
        price: parseFloat(item.price),
        cost_price: item.cost_price ? parseFloat(item.cost_price) : null,
        tax_rate: parseFloat(item.tax_rate),
        preparation_time: item.preparation_time,
        is_available: item.is_available,
        is_popular: item.is_popular,
        is_vegetarian: item.is_vegetarian,
        dietary_info: item.dietary_info,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    });
  } catch (error) {
    console.error("Get menu item by id error:", error);
    next(error);
  }
};

/* =========================
   UPDATE MENU ITEM
   PUT /api/hotel/menu/items/:id
========================= */
exports.updateMenuItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    let image_url = null;

    // Upload new image if provided
    if (req.file) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `hotel-management/menu/items/${hotelId}`,
      });
      image_url = uploadedImage.secure_url;
    }

    const {
      name,
      category_id,
      description,
      price,
      cost_price,
      tax_rate,
      preparation_time,
      is_available,
      is_popular,
      is_vegetarian,
      dietary_info,
    } = req.body;

    // Ensure item belongs to hotel
    const existing = await db.query(
      `SELECT id, category_id, image_url FROM menu_items WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId],
    );
    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Menu item not found");
    }

    // If category_id provided, verify it belongs to same hotel
    if (category_id) {
      const cat = await db.query(
        `SELECT id FROM menu_categories WHERE id = $1 AND hotel_id = $2`,
        [category_id, hotelId],
      );
      if (cat.rows.length === 0) {
        return errorResponse(res, 404, "Category not found");
      }
    }

    // If name + category_id changes, check duplicate name within category
    const effectiveCategoryId = category_id || existing.rows[0].category_id;

    if (name && name.trim()) {
      const dup = await db.query(
        `SELECT id FROM menu_items
         WHERE hotel_id = $1 
           AND category_id = $2
           AND LOWER(name) = LOWER($3)
           AND id <> $4`,
        [hotelId, effectiveCategoryId, name.trim(), id],
      );
      if (dup.rows.length > 0) {
        return errorResponse(
          res,
          409,
          "Menu item name already exists in this category",
        );
      }
    }

    if (price !== undefined && Number(price) <= 0) {
      return errorResponse(res, 400, "Price must be greater than 0");
    }

    const updated = await db.query(
      `
      UPDATE menu_items
      SET
        name = COALESCE($3, name),
        category_id = COALESCE($4, category_id),
        description = COALESCE($5, description),
        price = COALESCE($6, price),
        cost_price = COALESCE($7, cost_price),
        tax_rate = COALESCE($8, tax_rate),
        preparation_time = COALESCE($9, preparation_time),
        is_available = COALESCE($10, is_available),
        is_popular = COALESCE($11, is_popular),
        is_vegetarian = COALESCE($12, is_vegetarian),
        dietary_info = COALESCE($13, dietary_info),
        image_url = COALESCE($14, image_url, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND hotel_id = $2
      RETURNING *
      `,
      [
        id,
        hotelId,
        name && name.trim() ? name.trim() : null,
        category_id || null,
        description !== undefined ? description : null,
        price !== undefined ? parseFloat(price) : null,
        cost_price !== undefined && cost_price !== null
          ? parseFloat(cost_price)
          : null,
        tax_rate !== undefined ? parseFloat(tax_rate) : null,
        preparation_time !== undefined ? preparation_time : null,
        is_available !== undefined ? is_available : null,
        is_popular !== undefined ? is_popular : null,
        is_vegetarian !== undefined ? is_vegetarian : null,
        dietary_info !== undefined ? dietary_info : null,
        image_url !== undefined ? image_url : null,
      ],
    );

    const item = updated.rows[0];

    res.json({
      success: true,
      message: "Menu item updated successfully",
      item: {
        id: item.id,
        item_code: item.item_code,
        name: item.name,
        category_id: item.category_id,
        price: parseFloat(item.price),
        image_url: item.image_url,
        is_available: item.is_available,
        updated_at: item.updated_at,
      },
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    next(error);
  }
};

/* =========================
   DELETE MENU ITEM
   DELETE /api/hotel/menu/items/:id
========================= */
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const existing = await db.query(
      `SELECT id, image_url FROM menu_items WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId],
    );
    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Menu item not found");
    }

    // If you have order_items referencing menu_items, deleting could fail unless FK is ON DELETE SET NULL.
    // In your schema, order_items.menu_item_id has no ON DELETE rule.
    // So safer to set NULL in order_items first, or reject delete if used.
    const used = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM order_items WHERE menu_item_id = $1`,
      [id],
    );

    if (used.rows[0].cnt > 0) {
      return errorResponse(
        res,
        409,
        "Cannot delete item because it is used in orders. Mark it unavailable instead.",
      );
    }

    // Optionally delete image from Cloudinary
    if (existing.rows[0].image_url) {
      // Extract public_id and delete from Cloudinary if needed
      // This requires storing public_id or implementing deletion logic
    }

    await db.query(`DELETE FROM menu_items WHERE id = $1 AND hotel_id = $2`, [
      id,
      hotelId,
    ]);

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    next(error);
  }
};
