// src/routes/termsRoutes.js
const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { protectAdmin, protectHotelAdmin, protectStaff } = require('../middleware/auth');
const termsController = require('../controllers/termsControllers');

// ===================== VALIDATION MIDDLEWARE =====================
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

const validateParams = (schema) => (req, res, next) => {
  try {
    schema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// ===================== SCHEMAS =====================

/**
 * Terms and Conditions Creation Schema
 */
const createTermsSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  
  content: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content must be less than 50000 characters")
    .trim(),
  
  version: z.string()
    .min(1, "Version is required")
    .max(20, "Version must be less than 20 characters")
    .regex(/^\d+(?:\.\d+)*(?:-[a-z]+)?$/, "Invalid version format (e.g., 1.0, 2.1.0, 1.0-beta)"),
  
  type: z.enum(['platform', 'hotel', 'privacy', 'cancellation'])
    .optional()
    .default('platform'),
  
  applies_to: z.enum(['all', 'hotels', 'customers', 'staff'])
    .optional()
    .default('all'),
  
  is_active: z.boolean()
    .optional()
    .default(true),
  
  is_mandatory: z.boolean()
    .optional()
    .default(true),
  
  effective_from: z.string()
    .datetime({ offset: true })
    .optional()
    .refine(val => !val || new Date(val) <= new Date(), {
      message: "Effective from date cannot be in the past"
    }),
  
  effective_until: z.string()
    .datetime({ offset: true })
    .optional()
    .refine(val => !val || new Date(val) > new Date(), {
      message: "Effective until date must be in the future"
    }),
  
  languages: z.object({
    en: z.boolean().optional(),
    np: z.boolean().optional(),
    hi: z.boolean().optional(),
    zh: z.boolean().optional(),
    ar: z.boolean().optional()
  }).optional(),
  
  attachments: z.array(z.object({
    url: z.string().url("Invalid attachment URL"),
    name: z.string().min(1, "Attachment name is required"),
    size: z.number().int().positive().optional(),
    mime_type: z.string().optional()
  })).optional(),
  
  hotel_id: z.string().uuid("Invalid hotel ID format")
    .optional()
});

/**
 * Terms Update Schema
 */
const updateTermsSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .trim()
    .optional(),
  
  content: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content must be less than 50000 characters")
    .trim()
    .optional(),
  
  version: z.string()
    .min(1, "Version is required")
    .max(20, "Version must be less than 20 characters")
    .regex(/^\d+(?:\.\d+)*(?:-[a-z]+)?$/, "Invalid version format (e.g., 1.0, 2.1.0, 1.0-beta)")
    .optional(),
  
  type: z.enum(['platform', 'hotel', 'privacy', 'cancellation'])
    .optional(),
  
  applies_to: z.enum(['all', 'hotels', 'customers', 'staff'])
    .optional(),
  
  is_active: z.boolean().optional(),
  is_mandatory: z.boolean().optional(),
  
  effective_from: z.string()
    .datetime({ offset: true })
    .optional(),
  
  effective_until: z.string()
    .datetime({ offset: true })
    .optional(),
  
  languages: z.object({
    en: z.boolean().optional(),
    np: z.boolean().optional(),
    hi: z.boolean().optional(),
    zh: z.boolean().optional(),
    ar: z.boolean().optional()
  }).optional(),
  
  attachments: z.array(z.object({
    url: z.string().url("Invalid attachment URL"),
    name: z.string().min(1, "Attachment name is required"),
    size: z.number().int().positive().optional(),
    mime_type: z.string().optional()
  })).optional()
});

/**
 * Query Parameters Schema
 */
const listTermsQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "Page must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  
  type: z.enum(['platform', 'hotel', 'privacy', 'cancellation'])
    .optional(),
  
  is_active: z.enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  
  hotel_id: z.string().uuid("Invalid hotel ID format")
    .optional(),
  
  search: z.string()
    .max(100, "Search term too long")
    .optional(),
  
  sort_by: z.enum(['created_at', 'updated_at', 'version', 'title', 'effective_from'])
    .optional()
    .default('created_at'),
  
  sort_order: z.enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

/**
 * ID Parameter Schema
 */
const idParamSchema = z.object({
  id: z.string().uuid("Invalid terms ID format")
});

/**
 * Acceptance History Query Schema
 */
const acceptanceHistoryQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "Page must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform(Number)
    .pipe(z.number().int().min(1).max(50))
    .optional()
    .default('10'),
  
  user_type: z.enum(['main_admin', 'hotel_admin', 'staff'])
    .optional()
});

/**
 * Active Terms Query Schema
 */
const activeTermsQuerySchema = z.object({
  type: z.enum(['platform', 'hotel', 'privacy', 'cancellation'])
    .optional()
    .default('platform'),
  
  hotel_id: z.string().uuid("Invalid hotel ID format")
    .optional()
});

// ===================== PUBLIC ROUTES (no auth required) =====================

/**
 * @route GET /api/terms/active
 * @desc Get active terms and conditions
 * @access Public
 * @query {string} type - Terms type (platform/hotel/privacy/cancellation, default: platform)
 * @query {string} hotel_id - Hotel ID for hotel-specific terms
 * @returns {object} Active terms or null
 */
router.get('/active', validateQuery(activeTermsQuerySchema), termsController.getActiveTerms);

// ===================== PROTECTED ROUTES (require authentication) =====================

/**
 * @route GET /api/terms
 * @desc Get all terms with pagination and filters
 * @access Private (Admin, Hotel Admin, or Staff)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} type - Filter by type
 * @query {boolean} is_active - Filter by active status
 * @query {string} hotel_id - Filter by hotel ID
 * @query {string} search - Search in title and content
 * @query {string} sort_by - Sort field (created_at, updated_at, version, title, effective_from)
 * @query {string} sort_order - Sort order (ASC/DESC)
 * @returns {object} Paginated terms list
 */
router.get('/', validateQuery(listTermsQuerySchema), termsController.getAllTerms);

/**
 * @route GET /api/terms/:id
 * @desc Get terms by ID
 * @access Private (Admin, Hotel Admin, or Staff)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Terms details
 */
router.get('/:id', validateParams(idParamSchema), termsController.getTermsById);

/**
 * @route POST /api/terms
 * @desc Create new platform terms (admin only)
 * @access Private (Admin only)
 * @body {object} - Terms data
 * @returns {object} Created terms
 */
router.post('/', protectAdmin, validate(createTermsSchema), termsController.createTerms);

/**
 * @route PUT /api/terms/:id
 * @desc Update terms (admin only for platform terms)
 * @access Private (Admin only)
 * @param {string} id - Terms ID (UUID)
 * @body {object} - Terms fields to update
 * @returns {object} Updated terms
 */
router.put('/:id', protectAdmin, validateParams(idParamSchema), validate(updateTermsSchema), termsController.updateTerms);

/**
 * @route DELETE /api/terms/:id
 * @desc Delete terms (soft delete, admin only)
 * @access Private (Admin only)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Deletion confirmation
 */
router.delete('/:id', protectAdmin, validateParams(idParamSchema), termsController.deleteTerms);

// ===================== HOTEL-SPECIFIC ROUTES =====================

/**
 * @route GET /api/terms/hotel/active
 * @desc Get active terms for hotel (hotel admin only)
 * @access Private (Hotel Admin only)
 * @query {string} type - Terms type (default: platform)
 * @returns {object} Active terms
 */
router.get('/hotel/active', protectHotelAdmin, validateQuery(activeTermsQuerySchema), termsController.getActiveTerms);

/**
 * @route POST /api/terms/hotel
 * @desc Create hotel-specific terms (hotel admin only)
 * @access Private (Hotel Admin only)
 * @body {object} - Terms data (type automatically set to 'hotel')
 * @returns {object} Created terms
 */
router.post('/hotel', protectHotelAdmin, validate(createTermsSchema), termsController.createTerms);

/**
 * @route PUT /api/terms/hotel/:id
 * @desc Update hotel-specific terms (hotel admin only)
 * @access Private (Hotel Admin only)
 * @param {string} id - Terms ID (UUID)
 * @body {object} - Terms fields to update
 * @returns {object} Updated terms
 */
router.put('/hotel/:id', protectHotelAdmin, validateParams(idParamSchema), validate(updateTermsSchema), termsController.updateTerms);

/**
 * @route DELETE /api/terms/hotel/:id
 * @desc Delete hotel-specific terms (hotel admin only)
 * @access Private (Hotel Admin only)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Deletion confirmation
 */
router.delete('/hotel/:id', protectHotelAdmin, validateParams(idParamSchema), termsController.deleteTerms);

// ===================== ACCEPTANCE ROUTES =====================

/**
 * @route POST /api/terms/:id/accept
 * @desc Accept terms (hotel admin or staff)
 * @access Private (Hotel Admin or Staff)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Acceptance record
 */
router.post('/:id/accept', protectHotelAdmin, validateParams(idParamSchema), termsController.acceptTerms);

/**
 * @route GET /api/terms/:id/check
 * @desc Check if user has accepted terms
 * @access Private (Hotel Admin or Staff)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Acceptance status
 */
router.get('/:id/check', protectHotelAdmin, validateParams(idParamSchema), termsController.checkAcceptance);

/**
 * @route GET /api/terms/:id/acceptances
 * @desc Get acceptance history for terms (admin only)
 * @access Private (Admin only)
 * @param {string} id - Terms ID (UUID)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 50)
 * @query {string} user_type - Filter by user type
 * @returns {object} Paginated acceptance history
 */
router.get('/:id/acceptances', protectAdmin, validateParams(idParamSchema), validateQuery(acceptanceHistoryQuerySchema), termsController.getAcceptanceHistory);

// ===================== STAFF ACCEPTANCE ROUTES =====================

/**
 * @route POST /api/terms/staff/:id/accept
 * @desc Accept terms as staff
 * @access Private (Staff only)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Acceptance record
 */
router.post('/staff/:id/accept', protectStaff, validateParams(idParamSchema), termsController.acceptTerms);

/**
 * @route GET /api/terms/staff/:id/check
 * @desc Check if staff has accepted terms
 * @access Private (Staff only)
 * @param {string} id - Terms ID (UUID)
 * @returns {object} Acceptance status
 */
router.get('/staff/:id/check', protectStaff, validateParams(idParamSchema), termsController.checkAcceptance);

module.exports = router;