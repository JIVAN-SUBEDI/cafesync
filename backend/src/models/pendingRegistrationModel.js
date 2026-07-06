const db = require("../config/database");

class PendingRegistration {
  static async create(data) {
    const query = `
      INSERT INTO pending_registrations (
        hotel_name,
        hotel_slug,
        hotel_phone,
        hotel_address,
        city,
        country,
        timezone,
        currency,
        hotel_img,
        tax_rate,
        service_charge,
        admin_name,
        admin_email,
        admin_phone,
        admin_password_hash,
        recovery_email,
        subscription_plan_id,
        billing_cycle,
        registration_type,
        payment_method,
        payment_provider,
        amount,
        tax_amount,
        total_amount,
        transaction_uuid,
        provider_reference,
        payment_status,
        accept_terms,
        accept_marketing,
        expires_at,
        paid_at,
        completed_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32
      )
      RETURNING *;
    `;

    const values = [
      data.hotel_name,
      data.hotel_slug,
      data.hotel_phone || null,
      data.hotel_address || null,
      data.city || null,
      data.country || "US",
      data.timezone || "UTC",
      data.currency || "USD",
      data.hotel_img || "https://freesvg.org/img/abstract-user-flat-4.png",
      data.tax_rate ?? 10,
      data.service_charge ?? 5,
      data.admin_name,
      data.admin_email,
      data.admin_phone || null,
      data.admin_password_hash,
      data.recovery_email || null,
      data.subscription_plan_id,
      data.billing_cycle?.toLowerCase(),
      data.registration_type || "subscription",
      data.payment_method?.toLowerCase(),
      data.payment_provider,
      data.amount ?? 0,
      data.tax_amount ?? 0,
      data.total_amount ?? 0,
      data.transaction_uuid || null,
      data.provider_reference || null,
      data.payment_status || "pending",
      data.accept_terms ?? false,
      data.accept_marketing ?? false,
      data.expires_at || null,
      data.paid_at || null,
      data.completed_at || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT * FROM pending_registrations WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(admin_email) {
    const result = await db.query(
      `SELECT * FROM pending_registrations WHERE admin_email = $1 LIMIT 1`,
      [admin_email]
    );
    return result.rows[0] || null;
  }

  static async findBySlug(hotel_slug) {
    const result = await db.query(
      `SELECT * FROM pending_registrations WHERE hotel_slug = $1 LIMIT 1`,
      [hotel_slug]
    );
    return result.rows[0] || null;
  }

  static async findByTransactionUuid(transaction_uuid) {
    const result = await db.query(
      `SELECT * FROM pending_registrations WHERE transaction_uuid = $1 LIMIT 1`,
      [transaction_uuid]
    );
    return result.rows[0] || null;
  }

  static async findByProviderReference(provider_reference) {
    const result = await db.query(
      `SELECT * FROM pending_registrations WHERE provider_reference = $1 LIMIT 1`,
      [provider_reference]
    );
    return result.rows[0] || null;
  }

static async updatePartial(id, patch, client = db) {
  const filtered = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  );

  const keys = Object.keys(filtered);
  if (!keys.length) {
    throw new Error("No valid fields provided for update");
  }

  const values = Object.values(filtered);
  const setClause = keys
    .map((key, index) => `${key} = $${index + 2}`)
    .join(", ");

  const result = await client.query(
    `UPDATE pending_registrations
     SET ${setClause}
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  );

  return result.rows[0] || null;
}

static async delete(id, client = db) {
  const result = await client.query(
    `DELETE FROM pending_registrations WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

  static async findAll(limit = 50, offset = 0) {
    const result = await db.query(
      `
      SELECT *
      FROM pending_registrations
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return result.rows;
  }
}

module.exports = PendingRegistration;