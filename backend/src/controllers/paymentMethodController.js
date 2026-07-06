const pool = require("../config/database");

exports.createPaymentMethod = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { method_name, is_enabled } = req.body;

    const result = await pool.query(
      `INSERT INTO payment_methods 
       (hotel_id, method_name, is_enabled)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING *`,
      [hotelId, method_name, is_enabled]
    );

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaymentMethodsByHotel = async (req, res) => {
  try {
    const { hotelSlug } = req.params;

    // FIND HOTEL USING SLUG
    const hotelResult = await pool.query(
      `SELECT id FROM hotels WHERE hotel_slug = $1 LIMIT 1`,
      [hotelSlug]
    );

    if (hotelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const hotelId = hotelResult.rows[0].id;

    // GET PAYMENT METHODS
    const result = await pool.query(
      `SELECT * FROM payment_methods
       WHERE hotel_id = $1
       ORDER BY created_at DESC`,
      [hotelId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { method_name, is_enabled } = req.body;

    const result = await pool.query(
      `UPDATE payment_methods
       SET method_name = COALESCE($1, method_name),
           is_enabled = COALESCE($2, is_enabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [method_name, is_enabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      message: "Payment method updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM payment_methods
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};