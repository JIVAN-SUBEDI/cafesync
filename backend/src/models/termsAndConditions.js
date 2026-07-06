// src/models/TermsAndConditions.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TermsAndConditions {
    /**
     * Create a new terms and conditions
     */
    static async create(data) {
        const id = uuidv4();
        const {
            title,
            content,
            version,
            type = 'platform',
            applies_to = 'all',
            is_active = true,
            is_mandatory = true,
            effective_from = new Date(),
            effective_until = null,
            created_by = null,
            languages = { en: true },
            attachments = [],
            hotel_id = null
        } = data;

        const query = `
            INSERT INTO terms_and_conditions (
                id, title, content, version, type, applies_to,
                is_active, is_mandatory, effective_from, effective_until,
                created_by, languages, attachments, hotel_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            id, title, content, version, type, applies_to,
            is_active, is_mandatory, effective_from, effective_until,
            created_by, JSON.stringify(languages), JSON.stringify(attachments), hotel_id
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Find terms by ID
     */
    static async findById(id) {
        const query = `
            SELECT 
                tc.*,
                ma.email as created_by_email,
                ma.full_name as created_by_name
            FROM terms_and_conditions tc
            LEFT JOIN main_admins ma ON ma.id = tc.created_by
            WHERE tc.id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get all terms with pagination and filters
     */
    static async findAll(filters = {}) {
    const {
        page = 1,
        limit = 10,
        type,
        is_active,
        hotel_id,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const queryParams = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

    if (type) {
        whereClause += ` AND tc.type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
    }

    if (is_active !== undefined) {
        whereClause += ` AND tc.is_active = $${paramIndex}`;
        queryParams.push(is_active === 'true' || is_active === true);
        paramIndex++;
    }

    if (hotel_id) {
        whereClause += ` AND (tc.hotel_id = $${paramIndex} OR (tc.hotel_id IS NULL AND tc.type = 'platform'))`;
        queryParams.push(hotel_id);
        paramIndex++;
    }

    if (search) {
        whereClause += ` AND (tc.title ILIKE $${paramIndex} OR tc.content ILIKE $${paramIndex} OR tc.version ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM terms_and_conditions tc ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const query = `
        SELECT 
            tc.*,
            ma.email as created_by_email,
            ma.full_name as created_by_name,
            COUNT(DISTINCT uta.id) as acceptance_count
        FROM terms_and_conditions tc
        LEFT JOIN main_admins ma ON ma.id = tc.created_by
        LEFT JOIN user_terms_acceptance uta ON uta.term_id = tc.id
        ${whereClause}
        GROUP BY tc.id, ma.email, ma.full_name
        ORDER BY tc.${sort_by} ${sort_order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(query, queryParams);

    return {
        data: result.rows,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

    /**
     * Get active terms by type
     */
    static async getActiveTerms(type = 'platform', hotel_id = null) {
        const now = new Date().toISOString();
        const queryParams = [type, now];
        let hotelClause = '';

        if (hotel_id) {
            queryParams.push(hotel_id);
            hotelClause = `AND (hotel_id = $3 OR (hotel_id IS NULL AND type = 'platform'))`;
        }

        const query = `
            SELECT *
            FROM terms_and_conditions
            WHERE type = $1
              AND is_active = true
              AND effective_from <= $2
              AND (effective_until IS NULL OR effective_until >= $2)
              ${hotelClause}
            ORDER BY version DESC
            LIMIT 1
        `;

        const result = await db.query(query, queryParams);
        return result.rows[0];
    }

    /**
     * Update terms
     */
    static async update(id, data) {
        const {
            title,
            content,
            version,
            type,
            applies_to,
            is_active,
            is_mandatory,
            effective_from,
            effective_until,
            updated_by,
            languages,
            attachments
        } = data;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            values.push(content);
        }
        if (version !== undefined) {
            updates.push(`version = $${paramIndex++}`);
            values.push(version);
        }
        if (type !== undefined) {
            updates.push(`type = $${paramIndex++}`);
            values.push(type);
        }
        if (applies_to !== undefined) {
            updates.push(`applies_to = $${paramIndex++}`);
            values.push(applies_to);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }
        if (is_mandatory !== undefined) {
            updates.push(`is_mandatory = $${paramIndex++}`);
            values.push(is_mandatory);
        }
        if (effective_from !== undefined) {
            updates.push(`effective_from = $${paramIndex++}`);
            values.push(effective_from);
        }
        if (effective_until !== undefined) {
            updates.push(`effective_until = $${paramIndex++}`);
            values.push(effective_until);
        }
        if (updated_by !== undefined) {
            updates.push(`updated_by = $${paramIndex++}`);
            values.push(updated_by);
        }
        if (languages !== undefined) {
            updates.push(`languages = $${paramIndex++}`);
            values.push(JSON.stringify(languages));
        }
        if (attachments !== undefined) {
            updates.push(`attachments = $${paramIndex++}`);
            values.push(JSON.stringify(attachments));
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE terms_and_conditions
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Delete terms
     */
    static async delete(id) {
        // Check if there are any acceptances
        const checkQuery = 'SELECT COUNT(*) FROM user_terms_acceptance WHERE term_id = $1';
        const checkResult = await db.query(checkQuery, [id]);
        const count = parseInt(checkResult.rows[0].count);

        if (count > 0) {
            // Soft delete by marking inactive instead
            return await this.update(id, { is_active: false });
        }

        const query = 'DELETE FROM terms_and_conditions WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Record user acceptance of terms
     */
    static async recordAcceptance(termId, userId, userType, hotelId = null, ip = null, userAgent = null) {
        const id = uuidv4();
        const query = `
            INSERT INTO user_terms_acceptance (id, term_id, user_id, user_type, hotel_id, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (term_id, user_id, user_type) 
            DO UPDATE SET accepted_at = CURRENT_TIMESTAMP, ip_address = $6, user_agent = $7
            RETURNING *
        `;

        const values = [id, termId, userId, userType, hotelId, ip, userAgent];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Check if user has accepted terms
     */
    static async hasUserAccepted(termId, userId, userType) {
        const query = `
            SELECT * FROM user_terms_acceptance
            WHERE term_id = $1 AND user_id = $2 AND user_type = $3
        `;
        const result = await db.query(query, [termId, userId, userType]);
        return result.rows.length > 0;
    }

    /**
     * Get acceptance history for a term
     */
    static async getAcceptanceHistory(termId, filters = {}) {
        const {
            page = 1,
            limit = 10,
            user_type
        } = filters;

        const offset = (page - 1) * limit;
        const queryParams = [termId];
        let paramIndex = 2;

        let whereClause = 'WHERE term_id = $1';
        
        if (user_type) {
            whereClause += ` AND user_type = $${paramIndex++}`;
            queryParams.push(user_type);
        }

        const query = `
            SELECT 
                uta.*,
                CASE 
                    WHEN uta.user_type = 'hotel_admin' THEN (SELECT hotel_name FROM hotels WHERE id = uta.user_id::UUID)
                    WHEN uta.user_type = 'staff' THEN (SELECT full_name FROM staff WHERE id = uta.user_id::UUID)
                    ELSE 'Unknown'
                END as user_name
            FROM user_terms_acceptance uta
            ${whereClause}
            ORDER BY uta.accepted_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await db.query(query, queryParams);

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM user_terms_acceptance ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0].count);

        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = TermsAndConditions;