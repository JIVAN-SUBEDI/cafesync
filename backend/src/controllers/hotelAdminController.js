// src/controllers/hotelAdminController.js
const Hotel = require("../models/hotelModel");
const ActivityLog = require("../models/ActivityLog");
const { errorResponse } = require("../utils/helpers");

async function safeLog(data) {
  try { await ActivityLog.logActivity(data); } catch (e) { console.error(e); }
}

// DELETE /api/admin/hotels/:id
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return errorResponse(res, 404, "Hotel not found");

    // log before delete
    await safeLog({
      hotel_id: hotel.id,
      user_id: req.admin?.id || null,
      user_type: "main_admin",
      action: "hotel_deleted",
      details: JSON.stringify({ hotel_id: hotel.id, hotel_slug: hotel.hotel_slug }),
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    const deleted = await Hotel.delete(hotel.id);
    return res.json({ success: true, id: deleted.id });
  } catch (e) {
    next(e);
  }
};
