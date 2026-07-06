const db = require("../config/database.js");

const PasswordResetToken = {
  async create({ userId, tokenHash, expiresAt }) {
    const query = `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await db.query(query, [userId, tokenHash, expiresAt]);
    return result.rows[0];
  },

  async findLatestValidTokenByUserId(userId) {
    const query = `
      SELECT *
      FROM password_reset_tokens
      WHERE user_id = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  async markAsUsed(id) {
    const query = `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async deleteOldTokens(userId) {
    const query = `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
        AND used_at IS NULL;
    `;

    await db.query(query, [userId]);
  }
};

module.exports = PasswordResetToken;