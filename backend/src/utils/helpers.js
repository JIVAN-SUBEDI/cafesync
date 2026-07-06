const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const db = require("../config/database.js");

/**
 * Generate a secure random string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
exports.generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generate secure password hash
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
exports.verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Expiration time
 * @returns {string} JWT token
 */
exports.generateToken = (id, role, expiresIn = '7d') => {
  return jwt.sign(
    {id, role},
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate unique hotel slug
 * @param {string} hotelName - Hotel name
 * @returns {string} Unique slug
 */
exports.generateHotelSlug = (hotelName) => {
  return slugify(hotelName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
    locale: 'en'
  });
};

/**
 * Generate staff code based on role
 * @param {string} role - Staff role
 * @param {number} sequence - Sequence number
 * @returns {string} Staff code
 */
exports.generateStaffCode = (role, sequence) => {
  const rolePrefix = {
    'hotel_admin': 'HA',
    'receptionist': 'RC',
    'waiter': 'WA',
    'cook': 'CK',
    'kitchen_manager': 'KM',
    'cashier': 'CA',
    'cleaner': 'CL'
  }[role] || 'ST';

  return `${rolePrefix}${sequence.toString().padStart(3, '0')}`;
};


exports.findHotelById = async (hotelId) => {
  const { rows } = await db.query(
    `SELECT id, hotel_name, hotel_slug, admin_email, admin_name, 
            is_active, subscription_status, subscription_plan_id,
            created_at, updated_at
     FROM hotels WHERE id = $1`,
    [hotelId]
  );

  return rows[0] || null;
};



/**
 * Generate order number
 * @param {string} hotelSlug - Hotel slug
 * @param {number} sequence - Order sequence for the day
 * @returns {string} Order number
 */
exports.generateOrderNumber = (hotelSlug, sequence) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  return `${hotelSlug.toUpperCase()}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
};

/**
 * Generate invoice number
 * @returns {string} Invoice number
 */
exports.generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, etc.)
 * @returns {string} Formatted currency
 */
exports.formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate subscription end date
 * @param {Date} startDate - Subscription start date
 * @param {string} period - 'monthly', 'quarterly', 'yearly'
 * @returns {Date} Subscription end date
 */
exports.calculateSubscriptionEnd = (startDate, period = 'monthly') => {
  const endDate = new Date(startDate);
  
  switch (period) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

/**
 * Check if subscription is expiring soon
 * @param {Date} endDate - Subscription end date
 * @param {number} days - Days threshold
 * @returns {boolean} True if expiring soon
 */
exports.isSubscriptionExpiring = (endDate, days = 7) => {
  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff <= days && daysDiff > 0;
};

/**
 * Check if subscription is expired
 * @param {Date} endDate - Subscription end date
 * @returns {boolean} True if expired
 */
exports.isSubscriptionExpired = (endDate) => {
  return new Date(endDate) < new Date();
};

/**
 * Get days remaining until date
 * @param {Date} futureDate - Future date
 * @returns {number} Days remaining
 */
exports.getDaysRemaining = (futureDate) => {
  const now = new Date();
  const timeDiff = futureDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {string} format - Format type
 * @returns {string} Formatted date
 */
exports.formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'datetime':
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  }
};

/**
 * Calculate order total with tax and discount
 * @param {Array} items - Order items
 * @param {number} taxRate - Tax rate percentage
 * @param {number} discount - Discount amount
 * @returns {Object} Calculated totals
 */
exports.calculateOrderTotals = (items, taxRate = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity);
  }, 0);
  
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount_amount: Math.round(discount * 100) / 100,
    total_amount: Math.round(total * 100) / 100
  };
};

/**
 * Generate QR code data URL for table
 * @param {string} hotelSlug - Hotel slug
 * @param {string} tableId - Table ID
 * @returns {string} QR code data URL
 */
exports.generateTableQRCodeData = (hotelSlug, tableId) => {
  const qrData = {
    hotel: hotelSlug,
    table: tableId,
    url: `${process.env.APP_URL}/${hotelSlug}/table/${tableId}/order`,
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(qrData)).toString('base64');
};

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&<>"']/g, '') // Remove special characters
    .substring(0, 5000); // Limit length
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
exports.isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''));
};

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
exports.isValidSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

/**
 * Pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
exports.getPagination = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * Format pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Formatted pagination response
 */
exports.formatPagination = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Mask sensitive data for logging
 * @param {string} data - Sensitive data
 * @returns {string} Masked data
 */
exports.maskSensitiveData = (data) => {
  if (!data || typeof data !== 'string') return data;
  
  if (data.includes('@')) {
    // Email: john@example.com -> j***@example.com
    const [local, domain] = data.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }
  
  if (data.length > 4) {
    // Phone/ID: 1234567890 -> 123*****90
    return `${data.substring(0, 3)}*****${data.substring(data.length - 2)}`;
  }
  
  return '***';
};

/**
 * Generate password strength score
 * @param {string} password - Password to check
 * @returns {Object} Password strength info
 */
exports.checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters');
  
  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  // Numbers check
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  // Special characters check
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  const strength = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';
  
  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['Strong password!']
  };
};

/**
 * Generate API response structure
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response
 */
exports.apiResponse = (success, message, data = null, meta = {}) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

/**
 * Generate error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} details - Error details
 * @returns {Object} Error response
 */
exports.errorResponse = (res, statusCode = 400, message = "Error", code = null, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code ? { code } : {}),
    ...extra,
  });
};

exports.successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

module.exports = exports;