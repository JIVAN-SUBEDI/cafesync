// src/controllers/termsController.js
const TermsAndConditions = require('../models/termsAndConditions');
const logger = require('../utils/logger');

// Helper to generate request ID
const makeRequestId = (req) =>
    req.headers['x-request-id'] ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Create new terms and conditions
 */
exports.createTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        // Check if user is authenticated
        if (!req.admin && !req.hotel) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Data is already validated by Zod
        const {
            title,
            content,
            version,
            type = 'platform',
            applies_to = 'all',
            is_active = true,
            is_mandatory = true,
            effective_from,
            effective_until,
            languages,
            attachments,
            hotel_id
        } = req.body;

        // Determine created_by (admin or hotel)
        const created_by = req.admin?.id || req.hotel?.id;

        // For hotel-specific terms
        const finalHotelId = type === 'hotel' ? (req.hotel?.id || hotel_id) : null;

        // If hotel-specific and no hotel_id, return error
        if (type === 'hotel' && !finalHotelId) {
            return res.status(400).json({
                success: false,
                message: 'Hotel ID is required for hotel-specific terms'
            });
        }

        const termsData = {
            title,
            content,
            version,
            type,
            applies_to,
            is_active,
            is_mandatory,
            effective_from: effective_from || new Date(),
            effective_until,
            created_by,
            languages: languages || { en: true },
            attachments: attachments || [],
            hotel_id: finalHotelId
        };

        const terms = await TermsAndConditions.create(termsData);

        logger.info('TERMS_CREATED', {
            requestId,
            userId: created_by,
            userType: req.admin ? 'admin' : 'hotel',
            termsId: terms.id,
            version: terms.version,
            responseTime: Date.now() - start
        });

        return res.status(201).json({
            success: true,
            message: 'Terms and conditions created successfully',
            data: terms
        });

    } catch (error) {
        logger.error('TERMS_CREATION_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to create terms and conditions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all terms with pagination and filters
 */
exports.getAllTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        // Query parameters are already validated by Zod
        const {
            page = 1,
            limit = 10,
            type,
            is_active,
            hotel_id,
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const filters = {
            page: parseInt(page),
            limit: parseInt(limit),
            type,
            is_active,
            hotel_id,
            search,
            sort_by,
            sort_order
        };

        const result = await TermsAndConditions.findAll(filters);

        logger.info('TERMS_FETCHED', {
            requestId,
            count: result.data.length,
            total: result.pagination.total,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        logger.error('TERMS_FETCH_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch terms and conditions'
        });
    }
};

/**
 * Get single terms by ID
 */
exports.getTermsById = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        const { id } = req.params; // Already validated by Zod

        const terms = await TermsAndConditions.findById(id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms and conditions not found'
            });
        }

        logger.info('TERMS_FETCHED_BY_ID', {
            requestId,
            termsId: id,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            data: terms
        });

    } catch (error) {
        logger.error('TERMS_FETCH_BY_ID_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch terms and conditions'
        });
    }
};

/**
 * Get active terms
 */
exports.getActiveTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        const { type = 'platform', hotel_id } = req.query; // Already validated by Zod

        const terms = await TermsAndConditions.getActiveTerms(type, hotel_id);

        logger.info('ACTIVE_TERMS_FETCHED', {
            requestId,
            type,
            hotel_id: hotel_id || 'platform',
            found: !!terms,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            data: terms || null
        });

    } catch (error) {
        logger.error('ACTIVE_TERMS_FETCH_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active terms'
        });
    }
};

/**
 * Update terms
 */
exports.updateTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        // Check if user is authenticated
        if (!req.admin && !req.hotel) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { id } = req.params; // Already validated by Zod

        // Check if terms exist
        const existingTerms = await TermsAndConditions.findById(id);
        if (!existingTerms) {
            return res.status(404).json({
                success: false,
                message: 'Terms and conditions not found'
            });
        }

        // Check permission (only admin can update platform terms)
        if (existingTerms.type === 'platform' && !req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update platform terms'
            });
        }

        // For hotel terms, check if the hotel owns them
        if (existingTerms.type === 'hotel' && req.hotel && existingTerms.hotel_id !== req.hotel.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own hotel\'s terms'
            });
        }

        // Data is already validated by Zod
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
            languages,
            attachments
        } = req.body;

        const updated_by = req.admin?.id || req.hotel?.id;

        const updateData = {
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
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const updatedTerms = await TermsAndConditions.update(id, updateData);

        logger.info('TERMS_UPDATED', {
            requestId,
            userId: updated_by,
            userType: req.admin ? 'admin' : 'hotel',
            termsId: id,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            message: 'Terms and conditions updated successfully',
            data: updatedTerms
        });

    } catch (error) {
        logger.error('TERMS_UPDATE_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to update terms and conditions'
        });
    }
};

/**
 * Delete terms (soft delete by deactivating)
 */
exports.deleteTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        // Check if user is authenticated
        if (!req.admin && !req.hotel) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { id } = req.params; // Already validated by Zod

        // Check if terms exist
        const existingTerms = await TermsAndConditions.findById(id);
        if (!existingTerms) {
            return res.status(404).json({
                success: false,
                message: 'Terms and conditions not found'
            });
        }

        // Check permission
        if (existingTerms.type === 'platform' && !req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete platform terms'
            });
        }

        if (existingTerms.type === 'hotel' && req.hotel && existingTerms.hotel_id !== req.hotel.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own hotel\'s terms'
            });
        }

        const result = await TermsAndConditions.delete(id);

        logger.info('TERMS_DELETED', {
            requestId,
            userId: req.admin?.id || req.hotel?.id,
            userType: req.admin ? 'admin' : 'hotel',
            termsId: id,
            softDelete: !result,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            message: result ? 'Terms deleted successfully' : 'Terms deactivated successfully (has acceptances)'
        });

    } catch (error) {
        logger.error('TERMS_DELETE_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to delete terms and conditions'
        });
    }
};

/**
 * Accept terms
 */
exports.acceptTerms = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        const { id } = req.params; // Already validated by Zod

        // Determine user type and ID
        let userId, userType, hotelId = null;

        if (req.admin) {
            userId = req.admin.id;
            userType = 'main_admin';
        } else if (req.hotel) {
            userId = req.hotel.id;
            userType = 'hotel_admin';
            hotelId = req.hotel.id;
        } else if (req.staff) {
            userId = req.staff.id;
            userType = 'staff';
            hotelId = req.staff.hotel_id;
        } else {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if terms exist and are active
        const terms = await TermsAndConditions.findById(id);
        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms and conditions not found'
            });
        }

        if (!terms.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Terms are not active'
            });
        }

        // Record acceptance
        const acceptance = await TermsAndConditions.recordAcceptance(
            id,
            userId,
            userType,
            hotelId,
            req.ip,
            req.get('User-Agent')
        );

        logger.info('TERMS_ACCEPTED', {
            requestId,
            userId,
            userType,
            termsId: id,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            message: 'Terms accepted successfully',
            data: acceptance
        });

    } catch (error) {
        logger.error('TERMS_ACCEPT_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to accept terms'
        });
    }
};

/**
 * Check if user has accepted terms
 */
exports.checkAcceptance = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        const { id } = req.params; // Already validated by Zod

        // Determine user type and ID
        let userId, userType;

        if (req.admin) {
            userId = req.admin.id;
            userType = 'main_admin';
        } else if (req.hotel) {
            userId = req.hotel.id;
            userType = 'hotel_admin';
        } else if (req.staff) {
            userId = req.staff.id;
            userType = 'staff';
        } else {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const hasAccepted = await TermsAndConditions.hasUserAccepted(id, userId, userType);

        logger.info('TERMS_ACCEPTANCE_CHECKED', {
            requestId,
            userId,
            userType,
            termsId: id,
            hasAccepted,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            data: {
                accepted: hasAccepted,
                termsId: id
            }
        });

    } catch (error) {
        logger.error('TERMS_ACCEPTANCE_CHECK_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to check acceptance'
        });
    }
};

/**
 * Get acceptance history for a term
 */
exports.getAcceptanceHistory = async (req, res) => {
    const requestId = makeRequestId(req);
    const start = Date.now();

    try {
        // Only admins can view acceptance history
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can view acceptance history'
            });
        }

        const { id } = req.params; // Already validated by Zod
        const { page = 1, limit = 10, user_type } = req.query; // Already validated by Zod

        const filters = {
            page: parseInt(page),
            limit: parseInt(limit),
            user_type
        };

        // Check if terms exist
        const terms = await TermsAndConditions.findById(id);
        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms and conditions not found'
            });
        }

        const history = await TermsAndConditions.getAcceptanceHistory(id, filters);

        logger.info('ACCEPTANCE_HISTORY_FETCHED', {
            requestId,
            adminId: req.admin.id,
            termsId: id,
            count: history.data.length,
            responseTime: Date.now() - start
        });

        return res.json({
            success: true,
            ...history
        });

    } catch (error) {
        logger.error('ACCEPTANCE_HISTORY_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - start
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch acceptance history'
        });
    }
};