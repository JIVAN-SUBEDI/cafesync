const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationController");
const authMiddleware = require("../middleware/auth");

// save token
router.post("/fcm/save", authMiddleware.protectHotelAdmin, controller.saveFcmToken);

// disable token (logout)
router.post("/fcm/disable", authMiddleware.protectHotelAdmin, controller.disableFcmToken);

module.exports = router;