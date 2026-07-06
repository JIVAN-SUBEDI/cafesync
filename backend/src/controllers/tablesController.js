const db = require("../config/database.js");
const { errorResponse } = require("../utils/helpers.js");

/* =========================
   GET ALL TABLES
   GET /api/hotel/tables
========================= */
exports.getAllTables = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { status, section, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 20;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        t.id,
        t.table_number,
        t.table_name,
        t.capacity,
        t.floor_number,
        t.section,
        t.status,
        t.qr_code_url,
        t.created_at,
        t.updated_at,
        o.id AS current_order_id,
        o.order_number,
        o.total_amount AS current_order_amount,
        u.full_name AS waiter_name,
        (
          SELECT COUNT(*)
          FROM orders
          WHERE table_id = t.id
            AND DATE(created_at) = CURRENT_DATE
        ) AS today_orders_count,
        (
          SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE table_id = t.id
            AND DATE(created_at) = CURRENT_DATE
        ) AS today_sales
      FROM hotel_tables t
      LEFT JOIN orders o
        ON t.id = o.table_id
       AND o.status NOT IN ('completed', 'cancelled')
      LEFT JOIN users u
        ON o.waiter_id = u.id
       AND u.hotel_id = t.hotel_id
      WHERE t.hotel_id = $1
    `;

    let countQuery = `
      SELECT COUNT(*)
      FROM hotel_tables
      WHERE hotel_id = $1
    `;

    const params = [hotelId];
    const countParams = [hotelId];
    let paramCount = 1;
    let countParamCount = 1;

    if (status) {
      paramCount++;
      countParamCount++;
      query += ` AND t.status = $${paramCount}`;
      countQuery += ` AND status = $${countParamCount}`;
      params.push(status);
      countParams.push(status);
    }

    if (section) {
      paramCount++;
      countParamCount++;
      query += ` AND t.section = $${paramCount}`;
      countQuery += ` AND section = $${countParamCount}`;
      params.push(section);
      countParams.push(section);
    }

    query += `
      ORDER BY t.section NULLS LAST, t.table_number
      LIMIT $${paramCount + 1}
      OFFSET $${paramCount + 2}
    `;
    params.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    const total = Number(countResult.rows[0]?.count || 0);
    const totalPages = Math.ceil(total / limitNum);

    const tables = result.rows.map((table) => ({
      id: table.id,
      table_number: table.table_number,
      table_name: table.table_name,
      capacity: table.capacity,
      floor_number: table.floor_number,
      section: table.section || "Main Hall",
      status: table.status,
      qr_code_url: table.qr_code_url,
      current_order_id: table.current_order_id,
      current_order_number: table.order_number,
      current_order_amount:
        table.current_order_amount != null
          ? parseFloat(table.current_order_amount)
          : null,
      waiter_name: table.waiter_name,
      today_orders: Number(table.today_orders_count) || 0,
      today_sales: parseFloat(table.today_sales) || 0,
      created_at: table.created_at,
      updated_at: table.updated_at,
    }));

    const statsQuery = await db.query(
      `
      SELECT 
        COUNT(*) AS total_tables,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied_count,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved_count,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) AS cleaning_count,
        COUNT(DISTINCT section) AS sections_count,
        SUM(capacity) AS total_capacity,
        AVG(capacity) AS avg_capacity
      FROM hotel_tables
      WHERE hotel_id = $1
      `,
      [hotelId]
    );

    const stats = statsQuery.rows[0] || {};

    const sectionStatsQuery = await db.query(
      `
      SELECT 
        section,
        COUNT(*) AS table_count,
        SUM(capacity) AS total_capacity,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied_count
      FROM hotel_tables
      WHERE hotel_id = $1
      GROUP BY section
      ORDER BY section
      `,
      [hotelId]
    );

    const sectionStats = sectionStatsQuery.rows;

    return res.json({
      success: true,
      tables,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
      },
      statistics: {
        total_tables: Number(stats.total_tables) || 0,
        available: Number(stats.available_count) || 0,
        occupied: Number(stats.occupied_count) || 0,
        reserved: Number(stats.reserved_count) || 0,
        cleaning: Number(stats.cleaning_count) || 0,
        sections: Number(stats.sections_count) || 0,
        total_capacity: Number(stats.total_capacity) || 0,
        avg_capacity: parseFloat(stats.avg_capacity) || 0,
        occupancy_rate:
          Number(stats.total_tables) > 0
            ? Math.round(
                (Number(stats.occupied_count) / Number(stats.total_tables)) * 100
              )
            : 0,
      },
      section_statistics: sectionStats.map((section) => ({
        section: section.section || "Unassigned",
        table_count: Number(section.table_count) || 0,
        total_capacity: Number(section.total_capacity) || 0,
        occupied_count: Number(section.occupied_count) || 0,
        occupancy_rate:
          Number(section.table_count) > 0
            ? Math.round(
                (Number(section.occupied_count) / Number(section.table_count)) * 100
              )
            : 0,
      })),
    });
  } catch (error) {
    console.error("Get tables error:", error);
    next(error);
  }
};

/* =========================
   CREATE TABLE
   POST /api/hotel/tables
========================= */
exports.createTable = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { table_number, table_name, capacity, floor_number, section } = req.body;

    if (!capacity || Number(capacity) <= 0) {
      return errorResponse(res, 400, "Valid capacity is required");
    }

    const limitCheck = await db.query(
      `
      SELECT 
        COUNT(*) AS current_count,
        h.max_tables_allowed
      FROM hotel_tables t
      JOIN hotels h ON t.hotel_id = h.id
      WHERE t.hotel_id = $1
      GROUP BY h.max_tables_allowed
      `,
      [hotelId]
    );

    if (limitCheck.rows.length > 0) {
      const current = Number(limitCheck.rows[0].current_count || 0);
      const maxAllowed = Number(limitCheck.rows[0].max_tables_allowed || 0);

      if (maxAllowed > 0 && current >= maxAllowed) {
        return errorResponse(
          res,
          403,
          `Table limit reached. Maximum allowed: ${maxAllowed}`
        );
      }
    }

    if (table_number) {
      const duplicateCheck = await db.query(
        `
        SELECT id
        FROM hotel_tables
        WHERE hotel_id = $1
          AND table_number = $2
        `,
        [hotelId, table_number]
      );

      if (duplicateCheck.rows.length > 0) {
        return errorResponse(res, 409, "Table number already exists");
      }
    }

    const query = `
      INSERT INTO hotel_tables (
        hotel_id,
        table_number,
        table_name,
        capacity,
        floor_number,
        section,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      hotelId,
      table_number || null,
      table_name || null,
      Number(capacity),
      floor_number ? Number(floor_number) : 1,
      section || "Main Hall",
      "available",
    ];

    const result = await db.query(query, values);
    const newTable = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Table created successfully",
      table: {
        id: newTable.id,
        table_number: newTable.table_number,
        table_name: newTable.table_name,
        capacity: newTable.capacity,
        floor_number: newTable.floor_number,
        section: newTable.section,
        status: newTable.status,
        created_at: newTable.created_at,
      },
    });
  } catch (error) {
    console.error("Create table error:", error);
    if (error.code === "23505") {
      return errorResponse(res, 409, "Table number already exists");
    }
    next(error);
  }
};

/* =========================
   UPDATE TABLE STATUS
   PUT /api/hotel/tables/:id/status
========================= */
exports.updateTableStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotelId = req.hotelId;
    const { status, waiter_id, order_id } = req.body;

    if (!status) {
      return errorResponse(res, 400, "Status is required");
    }

    const validStatuses = ["available", "occupied", "reserved", "cleaning"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, "Invalid status");
    }

    if (waiter_id) {
      const waiterCheck = await db.query(
        `
        SELECT id
        FROM users
        WHERE id = $1
          AND hotel_id = $2
          AND is_active = true
        LIMIT 1
        `,
        [waiter_id, hotelId]
      );

      if (waiterCheck.rows.length === 0) {
        return errorResponse(res, 404, "Waiter not found");
      }
    }

    const query = `
      UPDATE hotel_tables
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND hotel_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, id, hotelId]);

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Table not found");
    }

    if (status === "occupied" && order_id) {
      await db.query(
        `
        UPDATE orders
        SET table_id = $1,
            waiter_id = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND hotel_id = $4
        `,
        [id, waiter_id || null, order_id, hotelId]
      );
    }

    return res.json({
      success: true,
      message: "Table status updated successfully",
      table: result.rows[0],
    });
  } catch (error) {
    console.error("Update table status error:", error);
    next(error);
  }
};

/* =========================
   GET TABLE BY ID
   GET /api/hotel/tables/:id
========================= */
exports.getTableById = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        t.id,
        t.table_number,
        t.table_name,
        t.capacity,
        t.floor_number,
        t.section,
        t.status,
        t.qr_code_url,
        t.created_at,
        t.updated_at,
        o.id AS current_order_id,
        o.order_number,
        o.total_amount AS current_order_amount,
        o.status AS current_order_status,
        u.full_name AS waiter_name
      FROM hotel_tables t
      LEFT JOIN orders o
        ON t.id = o.table_id
       AND o.status NOT IN ('completed', 'cancelled')
      LEFT JOIN users u
        ON o.waiter_id = u.id
       AND u.hotel_id = t.hotel_id
      WHERE t.id = $1
        AND t.hotel_id = $2
      `,
      [id, hotelId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Table not found");
    }

    const table = result.rows[0];

    return res.json({
      success: true,
      table: {
        id: table.id,
        table_number: table.table_number,
        table_name: table.table_name,
        capacity: table.capacity,
        floor_number: table.floor_number,
        section: table.section || "Main Hall",
        status: table.status,
        qr_code_url: table.qr_code_url,
        current_order: table.current_order_id
          ? {
              id: table.current_order_id,
              order_number: table.order_number,
              status: table.current_order_status,
              total_amount:
                table.current_order_amount != null
                  ? parseFloat(table.current_order_amount)
                  : 0,
              waiter_name: table.waiter_name,
            }
          : null,
        created_at: table.created_at,
        updated_at: table.updated_at,
      },
    });
  } catch (error) {
    console.error("Get table by id error:", error);
    next(error);
  }
};

/* =========================
   UPDATE TABLE
   PUT /api/hotel/tables/:id
========================= */
exports.updateTable = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const {
      table_number,
      table_name,
      capacity,
      floor_number,
      section,
      qr_code_url,
    } = req.body;

    const existing = await db.query(
      `
      SELECT id, table_number
      FROM hotel_tables
      WHERE id = $1
        AND hotel_id = $2
      `,
      [id, hotelId]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Table not found");
    }

    if (capacity !== undefined && Number(capacity) <= 0) {
      return errorResponse(res, 400, "Valid capacity is required");
    }

    if (table_number && table_number !== existing.rows[0].table_number) {
      const dup = await db.query(
        `
        SELECT id
        FROM hotel_tables
        WHERE hotel_id = $1
          AND table_number = $2
          AND id <> $3
        `,
        [hotelId, table_number, id]
      );

      if (dup.rows.length > 0) {
        return errorResponse(res, 409, "Table number already exists");
      }
    }

    const updated = await db.query(
      `
      UPDATE hotel_tables
      SET
        table_number = COALESCE($3, table_number),
        table_name = COALESCE($4, table_name),
        capacity = COALESCE($5, capacity),
        floor_number = COALESCE($6, floor_number),
        section = COALESCE($7, section),
        qr_code_url = COALESCE($8, qr_code_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND hotel_id = $2
      RETURNING *
      `,
      [
        id,
        hotelId,
        table_number !== undefined ? table_number : null,
        table_name !== undefined ? table_name : null,
        capacity !== undefined ? Number(capacity) : null,
        floor_number !== undefined ? Number(floor_number) : null,
        section !== undefined ? section : null,
        qr_code_url !== undefined ? qr_code_url : null,
      ]
    );

    return res.json({
      success: true,
      message: "Table updated successfully",
      table: updated.rows[0],
    });
  } catch (error) {
    console.error("Update table error:", error);
    if (error.code === "23505") {
      return errorResponse(res, 409, "Table number already exists");
    }
    next(error);
  }
};

/* =========================
   DELETE TABLE
   DELETE /api/hotel/tables/:id
========================= */
exports.deleteTable = async (req, res, next) => {
  try {
    const hotelId = req.hotelId;
    const { id } = req.params;

    const table = await db.query(
      `
      SELECT id, status
      FROM hotel_tables
      WHERE id = $1
        AND hotel_id = $2
      `,
      [id, hotelId]
    );

    if (table.rows.length === 0) {
      return errorResponse(res, 404, "Table not found");
    }

    if (table.rows[0].status === "occupied") {
      return errorResponse(res, 409, "Cannot delete an occupied table");
    }

    await db.query(
      `
      DELETE FROM hotel_tables
      WHERE id = $1
        AND hotel_id = $2
      `,
      [id, hotelId]
    );

    return res.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Delete table error:", error);
    next(error);
  }
};