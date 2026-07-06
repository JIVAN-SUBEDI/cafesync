const NotificationService = require("../services/notification.service");

// ===============================
// SAVE FCM TOKEN
// ===============================
exports.saveFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform, deviceId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    await NotificationService.saveFcmToken(
      userId,
      token,
      platform || "android",
    );

    res.json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to save FCM token",
    });
  }
};

// ===============================
// DISABLE FCM TOKEN (LOGOUT)
// ===============================
exports.disableFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    await NotificationService.deactivateToken(token);

    res.json({
      success: true,
      message: "FCM token disabled",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to disable FCM token",
    });
  }
};