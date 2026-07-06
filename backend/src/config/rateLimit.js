const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Memory store for rate limiting (in-memory, resets on server restart)
const memoryStore = new Map();

// Custom in-memory store implementation
const createMemoryStore = (windowMs) => {
  return {
    incr: (key, cb) => {
      const now = Date.now();
      const entry = memoryStore.get(key);
      
      if (!entry || entry.expiresAt < now) {
        // First request or expired entry
        memoryStore.set(key, {
          totalHits: 1,
          expiresAt: now + windowMs
        });
        return cb(null, 1, windowMs);
      }
      
      // Increment existing entry
      entry.totalHits++;
      memoryStore.set(key, entry);
      return cb(null, entry.totalHits, windowMs);
    },
    
    decrement: (key) => {
      const entry = memoryStore.get(key);
      if (entry) {
        entry.totalHits--;
        memoryStore.set(key, entry);
      }
    },
    
    resetKey: (key) => {
      memoryStore.delete(key);
    },
    
    // Clean up expired entries periodically
    cleanup: () => {
      const now = Date.now();
      for (const [key, entry] of memoryStore.entries()) {
        if (entry.expiresAt < now) {
          memoryStore.delete(key);
        }
      }
    }
  };
};

// Run cleanup every minute
setInterval(() => {
  for (const store of Object.values(storeRegistry)) {
    store.cleanup && store.cleanup();
  }
}, 60000);

const storeRegistry = {};

// Common rate limiter options
const commonRateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Skip rate limiting for certain IPs (e.g., monitoring services, internal services)
  skip: (req) => {
    const trustedIps = process.env.TRUSTED_IPS 
      ? process.env.TRUSTED_IPS.split(',')
      : [];
    
    return trustedIps.includes(req.ip);
  },
  
  // Custom key generator (IP + User-Agent for more granular limiting)
  keyGenerator: (req) => {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;
    
    // For authenticated users, we can use user ID instead of IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}:${userAgent}`;
    }
    
    // return `ip:${ip}:${userAgent}`;
     return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           'unknown';
  },
  
  // Custom handler when limit is exceeded
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : 'anonymous'
    });
    
    res.status(options.statusCode).json(options.message);
  },
  
  // Skip failed requests (don't count 4xx/5xx responses against the limit)
  skipFailedRequests: false,
  
  // Skip successful requests (only count failed ones - useful for login endpoints)
  skipSuccessfulRequests: false,
};

// Create store with appropriate window
const getStore = (windowMs) => {
  const storeKey = `store_${windowMs}`;
  if (!storeRegistry[storeKey]) {
    storeRegistry[storeKey] = createMemoryStore(windowMs);
  }
  return storeRegistry[storeKey];
};

// Authentication-specific rate limiter (stricter)
const authLimiter = rateLimit({
  ...commonRateLimitOptions,
  store: getStore(parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000),
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10, // 10 login attempts per hour
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  skipSuccessfulRequests: true, // Only count failed login attempts
});

// API endpoints rate limiter (more generous)
const apiLimiter = rateLimit({
  ...commonRateLimitOptions,
  store: getStore(parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000),
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 300, // 300 requests per 15 minutes
});

// Webhook endpoints rate limiter (very strict)
const webhookLimiter = rateLimit({
  store: getStore(parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000),
  windowMs: parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX, 10) || 100, // 100 webhooks per hour
  keyGenerator: (req) => `webhook:${req.ip}:${req.get('User-Agent')}`,
});

// Admin endpoints rate limiter
const adminLimiter = rateLimit({
  ...commonRateLimitOptions,
  store: getStore(parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000),
  windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX, 10) || 50, // 50 requests per hour for admin
});

// Health check endpoints (no rate limiting)
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit
  skip: true, // Skip rate limiting for health checks
});

// Public endpoints (more generous)
const publicLimiter = rateLimit({
  ...commonRateLimitOptions,
  store: getStore(parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000),
  windowMs: parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // 1 minute
  max: parseInt(process.env.PUBLIC_RATE_LIMIT_MAX, 10) || 30, // 30 requests per minute
});

// Export rate limiters
module.exports = {
  authLimiter,
  apiLimiter,
  webhookLimiter,
  adminLimiter,
  healthLimiter,
  publicLimiter,
  
  // Helper function to get rate limit stats (for monitoring)
  getStats: () => {
    return {
      totalKeys: memoryStore.size,
      stores: Object.keys(storeRegistry)
    };
  },
  
  // Helper to reset rate limiting for a specific key
  resetKey: (key) => {
    for (const store of Object.values(storeRegistry)) {
      store.resetKey && store.resetKey(key);
    }
  }
};