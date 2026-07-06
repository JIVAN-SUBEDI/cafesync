const db = require("../config/database");

class User {
  static baseSelect = `
    SELECT
      id,
      hotel_id,
      full_name,
      email,
      phone_number,
      password_hash,
      role,
      staff_code,
      profile_image,
      is_active,
      is_email_verified,
      failed_login_attempts,
      locked_until,
      last_login,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM users
  `;

  static async create(payload) {
    const query = `
      INSERT INTO users (
        hotel_id,
        full_name,
        email,
        phone_number,
        password_hash,
        role,
        staff_code,
        profile_image,
        is_active,
        is_email_verified,
        created_by,
        updated_by
      )
      VALUES (
        $1,$2,LOWER($3),$4,$5,$6,$7,$8,
        COALESCE($9, true),
        COALESCE($10, false),
        $11,$12
      )
      RETURNING *
    `;

    const values = [
      payload.hotel_id,
      payload.full_name,
      payload.email,
      payload.phone_number || null,
      payload.password_hash,
      payload.role || "waiter",
      payload.staff_code || null,
      payload.profile_image || null,
      payload.is_active,
      payload.is_email_verified,
      payload.created_by || null,
      payload.updated_by || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      `${this.baseSelect} WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }
  static async findByEmail(email){
        const result = await db.query(
      `${this.baseSelect} WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findByEmailAndHotelId(email, hotelId) {
    const result = await db.query(
      `${this.baseSelect} WHERE hotel_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1`,
      [hotelId, email]
    );
    return result.rows[0] || null;
  }

  static async findByHotelId(hotelId, options = {}) {
    const conditions = [`hotel_id = $1`];
    const values = [hotelId];
    let i = 2;

    if (options.role) {
      conditions.push(`role = $${i++}`);
      values.push(options.role);
    }

    if (typeof options.is_active === "boolean") {
      conditions.push(`is_active = $${i++}`);
      values.push(options.is_active);
    }

    if (options.search) {
      conditions.push(`(
        full_name ILIKE $${i}
        OR email ILIKE $${i}
        OR COALESCE(phone_number, '') ILIKE $${i}
        OR COALESCE(staff_code, '') ILIKE $${i}
      )`);
      values.push(`%${options.search}%`);
      i++;
    }

    const allowedSort = {
      created_at: "created_at",
      updated_at: "updated_at",
      full_name: "full_name",
      email: "email",
      role: "role",
      last_login: "last_login",
    };

    const sortBy = allowedSort[options.sort_by] || "created_at";
    const sortOrder =
      String(options.sort_order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit = Number(options.limit) > 0 ? Number(options.limit) : 100;
    const offset = Number(options.offset) >= 0 ? Number(options.offset) : 0;

    const query = `
      ${this.baseSelect}
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  static async updateById(id, payload) {
    const fields = [];
    const values = [];
    let i = 1;

    const setField = (key, value) => {
      if (typeof value === "undefined") return;
      fields.push(`${key} = $${i++}`);
      values.push(value);
    };

    setField("full_name", payload.full_name);
    setField("email", payload.email ? payload.email.toLowerCase() : undefined);
    setField("phone_number", payload.phone_number);
    setField("role", payload.role);
    setField("staff_code", payload.staff_code);
    setField("profile_image", payload.profile_image);
    // setField("recovery_email", payload.recovery_email);
    setField("is_active", payload.is_active);
    setField("is_email_verified", payload.is_email_verified);
    setField("failed_login_attempts", payload.failed_login_attempts);
    setField("locked_until", payload.locked_until);
    setField("last_login", payload.last_login);

    setField("updated_by", payload.updated_by);

    if (!fields.length) {
      throw new Error("No valid fields provided for update");
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async updateLastLogin(id) {
    const result = await db.query(
      `
      UPDATE users
      SET
        last_login = CURRENT_TIMESTAMP,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  static async deleteById(id) {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }
  static async updatePassword(id, hashedPassword) {
  const result = await db.query(
    `
    UPDATE users
    SET
      password_hash = $1,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [hashedPassword, id]
  );

  return result.rows[0] || null;
}

  static sanitize(user) {
    if (!user) return null;

    const {
      password_hash,
      password_reset_token,
      password_reset_expires,
      temp_reset_token,
      temp_reset_expires,
      ...safeUser
    } = user;

    return safeUser;
  }
}

module.exports = User;