const cors = require('cors');

// Allowed origins (production domains)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

// Development origins
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:5173', // Vite dev server
];

// Combine based on environment
const originList = process.env.NODE_ENV === 'production'
  ? allowedOrigins
  : [...allowedOrigins, ...developmentOrigins];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Allow requests from allowed origins
    if (originList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      const error = new Error('CORS policy: Origin not allowed');
      error.status = 403;
      callback(error);
    }
  },
  
  // Essential CORS headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Total-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  // Security headers
  credentials: true, // Allow cookies if needed
  maxAge: 86400, // 24 hours preflight cache
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware for logging CORS violations
const corsMiddleware = cors(corsOptions);

// Optional: Add CORS violation logging
const corsWithLogging = (req, res, next) => {
  const origin = req.headers.origin;
  
  corsMiddleware(req, res, (err) => {
    if (err) {
      // Log CORS violations in production
      if (process.env.NODE_ENV === 'production') {
        const logger = require('../utils/logger');
        logger.warn('CORS violation detected', {
          origin,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      return next(err);
    }
    
    // Add CORS headers for all responses
    res.header('Vary', 'Origin');
    
    next();
  });
};

module.exports = corsWithLogging;