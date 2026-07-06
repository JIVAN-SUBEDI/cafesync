// src/routes/hotelAdminRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelAdminController.js");

const { protectAdmin } = require("../middleware/auth.js");

router.delete("/hotels/:id", protectAdmin, ctrl.deleteHotel);

module.exports = router;
