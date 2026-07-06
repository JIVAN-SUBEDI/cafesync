// src/models/HotelModel.js
const BaseModel = require("./BaseModel");
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

class HotelModel extends BaseModel {
  constructor() {
    super("hotels");
  }

  /**
   * Find hotel by slug
   * @param {string} slug - Hotel slug
   * @returns {Promise<Object|null>} Hotel object or null
   */
  async findBySlug(slug) {
    try {
      const result = await db.query(
        `SELECT * FROM hotels WHERE hotel_slug = $1 LIMIT 1`,
        [slug]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding hotel by slug: ${error.message}`);
    }
  }

  /**
   * Find hotel by admin email
   * @param {string} email - Admin email
   * @returns {Promise<Object|null>} Hotel object or null
   */
  async findByAdminEmail(email) {
    try {
          const normalizedEmail = String(email || "").trim().toLowerCase();

      const result = await db.query(
        `SELECT * FROM hotels WHERE admin_email = $1 LIMIT 1`,
        [normalizedEmail]
      );
      // const admin= 'labname3@gmail.com'

      console.log('this resu:- ', result.rows[0])
      // console.log('thisi is reqult;- ', result)
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding hotel by email: ${error.message}`);
    }
  }

  async findByRecoveryEmail(email){
    try {
      const result=await db.query(
        `select * from hotels where recovery_email= $1 limit 1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error (`Error finding recovery email: ${error.message}`)
    }
  }
  /**
   * Find hotel by ID
   * @param {string} id - Hotel ID
   * @returns {Promise<Object|null>} Hotel object or null
   */
  async findById(id) {
    try {
      const result = await db.query(
        `SELECT * FROM hotels WHERE id = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding hotel by ID: ${error.message}`);
    }
  }

  /**
   * Generate unique slug for hotel
   * @param {string} hotelName - Hotel name
   * @returns {Promise<string>} Unique slug
   */
  async generateUniqueSlug(hotelName) {
    const base = slugify(hotelName, { lower: true, strict: true });
    let slug = base;
    let counter = 1;

    while (await this.findBySlug(slug)) {
      slug = `${base}-${counter}`;
      counter++;
      if (counter > 100) {
        // Fallback to timestamp-based slug
        return `${base}-${Date.now().toString().slice(-6)}`;
      }
    }
    return slug;
  }

  /**
   * Validate slug format
   * @param {string} slug - Slug to validate
   * @returns {boolean} True if valid
   */
  isValidSlug(slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  /**
   * Create hotel with subscription handling
   * @param {Object} params - Parameters
   * @param {Object} params.payload - Hotel data
   * @param {Object} params.plan_details - Subscription plan details
   * @param {string} params.registration_type - 'trial' or 'subscription'
   * @returns {Promise<Object>} Created hotel with all subscription fields properly set
   */
  // src/models/hotelModel.js - createHotelWithSubscription method
async createHotelWithSubscription(payload, client) {
  const shouldManageOwnTransaction = !client;
  const dbClient = client || await db.getClient();

  try {
    if (shouldManageOwnTransaction) {
      await dbClient.query("BEGIN");
    }

    // slug check
    let slug = payload.hotel_slug;
    if (slug) {
      if (!this.isValidSlug(slug)) {
        throw new Error("INVALID_SLUG");
      }
      const existingSlug = await this.findBySlug(slug, dbClient);
      if (existingSlug) {
        throw new Error("SLUG_TAKEN");
      }
    } else {
      slug = await this.generateUniqueSlug(payload.hotel_name, dbClient);
    }

    const hotelData = {
      hotel_name: payload.hotel_name,
      hotel_slug: slug,
      hotel_img: payload.hotel_img || null,
      hotel_phone: payload.hotel_phone || null,
      hotel_address: payload.hotel_address || null,
      city: payload.city || null,
      country: payload.country || "Nepal",
      timezone: payload.timezone || "Asia/Kathmandu",
      currency: payload.currency || "NPR",
      tax_rate: Number(payload.tax_rate || 10),
      service_charge: Number(payload.service_charge || 5),

      subscription_plan_id: payload.subscription_plan_id || null,
      billing_cycle: payload.billing_cycle || "monthly",
      registration_type: payload.registration_type || "trial",

      subscription_status: payload.subscription_status || "trial",
      payment_status: payload.payment_status || null,

      subscription_start_date: payload.subscription_start_date || null,
      subscription_end_date: payload.subscription_end_date || null,
      trial_starts_at: payload.trial_starts_at || null,
      trial_ends_at: payload.trial_ends_at || null,

      max_staff_allowed: payload.max_staff_allowed || 5,
      max_tables_allowed: payload.max_tables_allowed || 20,
      max_menu_items_allowed: payload.max_menu_items_allowed || 100,

      is_active: payload.is_active ?? true,
      is_verified: payload.is_verified ?? true,
      accept_marketing: !!payload.accept_marketing,

      created_at: new Date(),
      updated_at: new Date(),
    };

    const columns = Object.keys(hotelData);
    const values = Object.values(hotelData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const insertQuery = `
      INSERT INTO hotels (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await dbClient.query(insertQuery, values);
    const hotel = result.rows[0];

    if (shouldManageOwnTransaction) {
      await dbClient.query("COMMIT");
    }

    return hotel;
  } catch (error) {
    if (shouldManageOwnTransaction) {
      await dbClient.query("ROLLBACK");
    }
    throw error;
  } finally {
    if (shouldManageOwnTransaction) {
      dbClient.release();
    }
  }
}


  /**
   * Update last login timestamp
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(hotelId) {
    try {
      await db.query(
        `UPDATE hotels SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
        [hotelId]
      );
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }

  /**
   * Update login attempts for rate limiting
   * @param {string} hotelId - Hotel ID
   * @param {number} attempts - Number of attempts
   * @param {Date} lockUntil - Lock until timestamp
   * @returns {Promise<void>}
   */
  async updateLoginAttempts(hotelId, attempts, lockUntil = null) {
    try {
      await db.query(
        `UPDATE hotels SET login_attempts = $1, lock_until = $2, updated_at = NOW() WHERE id = $3`,
        [attempts, lockUntil, hotelId]
      );
    } catch (error) {
      throw new Error(`Error updating login attempts: ${error.message}`);
    }
  }

  /**
   * Reset login attempts after successful login
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<void>}
   */
  async resetLoginAttempts(hotelId) {
    try {
      await db.query(
        `UPDATE hotels SET login_attempts = 0, lock_until = NULL, updated_at = NOW() WHERE id = $1`,
        [hotelId]
      );
    } catch (error) {
      throw new Error(`Error resetting login attempts: ${error.message}`);
    }
  }

  /**
   * Update hotel profile (subscriber allowed fields only)
   * @param {string} hotelId - Hotel ID
   * @param {Object} patch - Fields to update
   * @returns {Promise<Object|null>} Updated hotel or null
   */
  async updateMyHotel(hotelId, patch) {
    // Fields that subscribers cannot update
    const blockedFields = new Set([
      "admin_password_hash",
      "admin_email",
      "subscription_plan_id",
      "subscription_status",
      "subscription_start_date",
      "subscription_end_date",
      "trial_ends_at",
      "max_staff_allowed",
      "max_tables_allowed",
      "max_menu_items_allowed",
      "is_active",
      "is_verified",
      "verification_token",
      "verification_token_expires",
      "password_reset_token",
      "password_reset_expires",
      "temp_reset_token",
      "temp_reset_expires",
      "login_attempts",
      "lock_until",
      "last_login",
      "created_at",
      "updated_at",
      "registration_type",
      "payment_status"
    ]);

    // Filter out blocked fields
    const filteredPatch = {};
    for (const [key, value] of Object.entries(patch)) {
      if (!blockedFields.has(key) && value !== undefined && value !== null) {
        filteredPatch[key] = value;
      }
    }

    if (Object.keys(filteredPatch).length === 0) {
      return null;
    }

    // If updating hotel_slug, validate it
    if (filteredPatch.hotel_slug) {
      if (!this.isValidSlug(filteredPatch.hotel_slug)) {
        throw new Error("INVALID_SLUG");
      }
      
      // Check if slug is already taken by another hotel
      const existingHotel = await this.findBySlug(filteredPatch.hotel_slug);
      if (existingHotel && existingHotel.id !== hotelId) {
        throw new Error("SLUG_TAKEN");
      }
    }

    // Add updated_at timestamp
    filteredPatch.updated_at = new Date();

    // Build update query dynamically
    const setClause = Object.keys(filteredPatch)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [hotelId, ...Object.values(filteredPatch)];

    const query = `
      UPDATE hotels 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint?.includes('hotel_slug')) {
          throw new Error("SLUG_TAKEN");
        }
        if (error.constraint?.includes('admin_email')) {
          throw new Error("ADMIN_EMAIL_TAKEN");
        }
      }
      throw new Error(`Error updating hotel: ${error.message}`);
    }
  }

  /**
   * Update hotel password
   * @param {string} hotelId - Hotel ID
   * @param {string} newPasswordHash - New password hash
   * @returns {Promise<boolean>} True if successful
   */
  async updatePassword(hotelId, newPasswordHash) {
    try {
      const result = await db.query(
        `UPDATE hotels 
         SET admin_password_hash = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id`,
        [newPasswordHash, hotelId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  async updateRecoveryEmail(hotelId, recoveryEmail) {
    const query = `
      UPDATE hotels 
      SET recovery_email = $2, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING id, recovery_email
    `;
    const result = await db.query(query, [hotelId, recoveryEmail]);
    return result.rows[0];
  }

  /**
   * Remove recovery email
   */
  async removeRecoveryEmail(hotelId) {
    const query = `
      UPDATE hotels 
      SET recovery_email = NULL, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING id
    `;
    const result = await db.query(query, [hotelId]);
    return result.rows[0];
  }


  /**
   * Store password reset OTP
   * @param {string} hotelId - Hotel ID
   * @param {string} hashedOTP - Hashed OTP
   * @param {Date} expiresAt - Expiry timestamp
   * @returns {Promise<void>}
   */
  async storePasswordResetOTP(hotelId, hashedOTP, expiresAt) {
    try {
      await db.query(
        `UPDATE hotels 
         SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW() 
         WHERE id = $3`,
        [hashedOTP, expiresAt, hotelId]
      );
    } catch (error) {
      throw new Error(`Error storing password reset OTP: ${error.message}`);
    }
  }

  /**
   * Store temporary reset token after OTP verification
   * @param {string} hotelId - Hotel ID
   * @param {string} tempToken - Temporary token
   * @param {Date} expiresAt - Expiry timestamp
   * @returns {Promise<void>}
   */
  async storeTempResetToken(hotelId, tempToken, expiresAt) {
    try {
      await db.query(
        `UPDATE hotels 
         SET temp_reset_token = $1, temp_reset_expires = $2, updated_at = NOW() 
         WHERE id = $3`,
        [tempToken, expiresAt, hotelId]
      );
    } catch (error) {
      throw new Error(`Error storing temp reset token: ${error.message}`);
    }
  }

  /**
   * Find hotel by temporary reset token
   * @param {string} tempToken - Temporary token
   * @returns {Promise<Object|null>} Hotel object or null
   */
  async findByTempResetToken(tempToken) {
    try {
      const result = await db.query(
        `SELECT * FROM hotels 
         WHERE temp_reset_token = $1 
         AND temp_reset_expires > NOW() 
         LIMIT 1`,
        [tempToken]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding by temp token: ${error.message}`);
    }
  }

  /**
   * Clear reset tokens after password change
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<void>}
   */
  async clearResetTokens(hotelId) {
    try {
      await db.query(
        `UPDATE hotels 
         SET password_reset_token = NULL, 
             password_reset_expires = NULL, 
             temp_reset_token = NULL, 
             temp_reset_expires = NULL,
             updated_at = NOW() 
         WHERE id = $1`,
        [hotelId]
      );
    } catch (error) {
      throw new Error(`Error clearing reset tokens: ${error.message}`);
    }
  }

  /**
   * Extend OTP expiry
   * @param {string} hotelId - Hotel ID
   * @param {Date} newExpiry - New expiry timestamp
   * @returns {Promise<void>}
   */
  async extendOTPExpiry(hotelId, newExpiry) {
    try {
      await db.query(
        `UPDATE hotels 
         SET password_reset_expires = $1, updated_at = NOW() 
         WHERE id = $2`,
        [newExpiry, hotelId]
      );
    } catch (error) {
      throw new Error(`Error extending OTP expiry: ${error.message}`);
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} Verified hotel or null
   */
  async verifyEmail(token) {
    try {
      const result = await db.query(
        `UPDATE hotels 
         SET is_verified = true, 
             verification_token = NULL, 
             verification_token_expires = NULL,
             updated_at = NOW() 
         WHERE verification_token = $1 
           AND verification_token_expires > NOW() 
           AND is_verified = false 
         RETURNING *`,
        [token]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error verifying email: ${error.message}`);
    }
  }

  /**
   * Get subscription status with effective status
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Complete subscription status with all dates
   */
  async getSubscriptionStatus(hotelId) {
    try {
      const result = await db.query(
        `SELECT 
          id, 
          hotel_name, 
          registration_type, 
          subscription_status,
          subscription_start_date,
          subscription_end_date, 
          trial_ends_at,
          payment_status, 
          is_active, 
          is_verified,
          subscription_plan_id,
          -- Calculate effective status based on dates
          CASE 
            WHEN registration_type = 'trial' AND trial_ends_at < NOW() THEN 'trial_expired'
            WHEN registration_type = 'subscription' AND subscription_end_date < NOW() THEN 'expired'
            WHEN registration_type = 'subscription' AND payment_status = 'pending' THEN 'payment_pending'
            ELSE subscription_status
          END as effective_status,
          -- Calculate days remaining
          CASE
            WHEN registration_type = 'trial' AND trial_ends_at IS NOT NULL 
              THEN EXTRACT(DAY FROM (trial_ends_at - NOW()))
            WHEN registration_type = 'subscription' AND subscription_end_date IS NOT NULL 
              THEN EXTRACT(DAY FROM (subscription_end_date - NOW()))
            ELSE NULL
          END as days_remaining,
          -- Return expiry date
          CASE
            WHEN registration_type = 'trial' THEN trial_ends_at
            ELSE subscription_end_date
          END as expiry_date
        FROM hotels
        WHERE id = $1`,
        [hotelId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting subscription status: ${error.message}`);
    }
  }

  /**
   * Check if slug exists
   * @param {string} slug - Hotel slug
   * @returns {Promise<boolean>} True if exists
   */
  async checkSlugExists(slug) {
    try {
      const result = await db.query(
        `SELECT id FROM hotels WHERE hotel_slug = $1 LIMIT 1`,
        [slug]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking slug: ${error.message}`);
    }
  }

  /**
   * Get default subscription plan (for fallback)
   * @returns {Promise<Object|null>} Default plan
   */
  async getDefaultPlan() {
    try {
      const result = await db.query(
        `SELECT * FROM subscription_plans 
         WHERE is_active = true 
         ORDER BY price_per_year ASC 
         LIMIT 1`
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting default plan: ${error.message}`);
    }
  }

  /**
   * Get hotel with subscription plan details
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Hotel with plan details
   */
  async getHotelWithPlan(hotelId) {
    try {
      const result = await db.query(
        `SELECT h.*, 
          sp.plan_name, 
          sp.plan_code, 
          sp.price_per_year, 
          sp.features,
          sp.max_staff as plan_max_staff,
          sp.max_tables as plan_max_tables,
          sp.max_menu_items as plan_max_menu_items
         FROM hotels h
         LEFT JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
         WHERE h.id = $1`,
        [hotelId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting hotel with plan: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   * @param {string} hotelId - Hotel ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<boolean>} True if successful
   */
  async cancelSubscription(hotelId, reason = null) {
    try {
      const result = await db.query(
        `UPDATE hotels 
         SET subscription_status = 'cancelled',
             updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [hotelId]
      );
      
      // Log cancellation reason if provided
      if (reason && result.rowCount > 0) {
        console.log(`Subscription cancelled for hotel ${hotelId}: ${reason}`);
      }
      
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error cancelling subscription: ${error.message}`);
    }
  }

  /**
   * Update payment status
   * @param {string} hotelId - Hotel ID
   * @param {string} status - Payment status
   * @param {string} paymentMethod - Payment method
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object|null>} Updated hotel
   */
  async updatePaymentStatus(hotelId, status, paymentMethod = null, transactionId = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Update hotel payment status
      const result = await client.query(
        `UPDATE hotels 
         SET payment_status = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, hotelId]
      );

      // If payment is completed, update subscription status to active
      if (status === 'paid') {
        await client.query(
          `UPDATE hotels 
           SET subscription_status = 'active',
               updated_at = NOW()
           WHERE id = $1 AND registration_type = 'subscription'`,
          [hotelId]
        );

        // Update the corresponding invoice
        await client.query(
          `UPDATE subscription_invoices 
           SET status = 'paid', 
               paid_at = NOW(),
               payment_method = $1,
               transaction_id = $2,
               updated_at = NOW()
           WHERE hotel_id = $3 AND status = 'pending'`,
          [paymentMethod, transactionId, hotelId]
        );
      }

      await client.query('COMMIT');
      return result.rows[0] || null;

    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error updating payment status: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Renew subscription
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Updated hotel
   */
  async renewSubscription(hotelId) {
    try {
      const result = await db.query(
        `UPDATE hotels 
         SET subscription_end_date = subscription_end_date + INTERVAL '1 year',
             updated_at = NOW()
         WHERE id = $1 AND registration_type = 'subscription'
         RETURNING *`,
        [hotelId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error renewing subscription: ${error.message}`);
    }
  }

  /**
   * Get hotels with expiring subscriptions (for notifications)
   * @param {number} daysBefore - Days before expiry
   * @returns {Promise<Array>} List of hotels with expiring subscriptions
   */
  async getExpiringSubscriptions(daysBefore = 7) {
    try {
      const result = await db.query(
        `SELECT h.*, 
          sp.plan_name,
          EXTRACT(DAY FROM (subscription_end_date - NOW())) as days_remaining
         FROM hotels h
         LEFT JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
         WHERE h.registration_type = 'subscription'
           AND h.subscription_status = 'active'
           AND h.subscription_end_date IS NOT NULL
           AND h.subscription_end_date BETWEEN NOW() AND NOW() + INTERVAL '${daysBefore} days'
         ORDER BY h.subscription_end_date ASC`
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting expiring subscriptions: ${error.message}`);
    }
  }

  /**
   * Get hotels with expired trials
   * @returns {Promise<Array>} List of hotels with expired trials
   */
  async getExpiredTrials() {
    try {
      const result = await db.query(
        `SELECT * FROM hotels 
         WHERE registration_type = 'trial'
           AND subscription_status = 'trial'
           AND trial_ends_at < NOW()
         ORDER BY trial_ends_at ASC`
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting expired trials: ${error.message}`);
    }
  }

  /**
   * Search hotels (for admin)
   * @param {Object} filters - Search filters
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} List of hotels
   */
  async searchHotels(filters = {}, limit = 50, offset = 0) {
    try {
      let query = `SELECT * FROM hotels WHERE 1=1`;
      const values = [];
      let paramIndex = 1;

      if (filters.search) {
        query += ` AND (hotel_name ILIKE $${paramIndex} OR admin_email ILIKE $${paramIndex})`;
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.subscription_status) {
        query += ` AND subscription_status = $${paramIndex}`;
        values.push(filters.subscription_status);
        paramIndex++;
      }

      if (filters.registration_type) {
        query += ` AND registration_type = $${paramIndex}`;
        values.push(filters.registration_type);
        paramIndex++;
      }

      if (filters.payment_status) {
        query += ` AND payment_status = $${paramIndex}`;
        values.push(filters.payment_status);
        paramIndex++;
      }

      if (filters.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        values.push(filters.is_active);
        paramIndex++;
      }

      if (filters.is_verified !== undefined) {
        query += ` AND is_verified = $${paramIndex}`;
        values.push(filters.is_verified);
        paramIndex++;
      }

      if (filters.country) {
        query += ` AND country = $${paramIndex}`;
        values.push(filters.country);
        paramIndex++;
      }

      if (filters.created_after) {
        query += ` AND created_at >= $${paramIndex}`;
        values.push(filters.created_after);
        paramIndex++;
      }

      if (filters.created_before) {
        query += ` AND created_at <= $${paramIndex}`;
        values.push(filters.created_before);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error searching hotels: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics for a hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats(hotelId) {
    try {
      const result = await db.query(
        `SELECT * FROM hotel_dashboard_stats WHERE hotel_id = $1`,
        [hotelId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting dashboard stats: ${error.message}`);
    }
  }
}

module.exports = new HotelModel();