const admin = require("../config/firebase");
const db = require("../config/database.js");

class NotificationService {

  // ===============================
  // 1. SAVE / UPDATE FCM TOKEN
  // ===============================
  static async saveFcmToken(userId, token, platform = "android") {
    const existing = await db.query(
      "SELECT id FROM user_devices WHERE fcm_token = $1",
      [token]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE user_devices
         SET user_id = $1,
             platform = $2,
             is_active = true,
             last_used = NOW()
         WHERE fcm_token = $3`,
        [userId, platform, token]
      );
      return;
    }

    await db.query(
      `INSERT INTO user_devices (user_id, fcm_token, platform)
       VALUES ($1, $2, $3)`,
      [userId, token, platform]
    );
  }

  // ===============================
  // 2. GET USER TOKENS
  // ===============================
  static async getUserTokens(userId) {
    const result = await db.query(
      `SELECT fcm_token
       FROM user_devices
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    return result.rows.map(row => row.fcm_token);
  }

  // ===============================
  // 3. GET MULTIPLE USERS TOKENS (NEW 🔥)
  // ===============================
  static async getUsersTokens(userIds = []) {
    if (!userIds.length) return [];

    const result = await db.query(
      `SELECT fcm_token
       FROM user_devices
       WHERE user_id = ANY($1) AND is_active = true`,
      [userIds]
    );

    return result.rows.map(r => r.fcm_token);
  }

  // ===============================
  // 4. SEND TO SINGLE USER (OLD)
  // ===============================
  static async sendToUser(userId, { title, body, data = {} }) {
    const tokens = await this.getUserTokens(userId);

    if (!tokens.length) {
      console.log("No FCM tokens found for user:", userId);
      return;
    }

    return this._sendToTokens(tokens, { title, body, data });
  }

  // ===============================
  // 5. SEND TO MULTIPLE USERS (NEW 🔥)
  // ===============================
  static async sendToUsers(userIds = [], { title, body, data = {} }) {
    const tokens = await this.getUsersTokens(userIds);

    if (!tokens.length) {
      console.log("No FCM tokens found for users:", userIds);
      return;
    }

    return this._sendToTokens(tokens, { title, body, data });
  }

  // ===============================
  // 6. CORE BULK SENDER (SAFE + SCALABLE)
  // ===============================
  static async _sendToTokens(tokens, { title, body, data = {} }) {
    const message = {
      tokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `FCM Sent → Success: ${response.successCount}, Failed: ${response.failureCount}`
      );

      return response;
    } catch (err) {
      console.error("FCM send error:", err);
      throw err;
    }
  }

  // ===============================
  // 7. DEACTIVATE TOKEN
  // ===============================
  static async deactivateToken(token) {
    await db.query(
      `UPDATE user_devices
       SET is_active = false
       WHERE fcm_token = $1`,
      [token]
    );
  }

  // ===============================
  // 8. REMOVE TOKEN
  // ===============================
  static async removeToken(token) {
    await db.query(
      `DELETE FROM user_devices WHERE fcm_token = $1`,
      [token]
    );
  }
}

module.exports = NotificationService;