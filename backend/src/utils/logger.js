// 




const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      // Mask sensitive data in logs
      const maskedMeta = maskSensitiveLogData(meta);
      log += ` ${JSON.stringify(maskedMeta)}`;
    }
    
    return log;
  })
);

// Mask sensitive data in logs
function maskSensitiveLogData(data) {
  if (typeof data !== 'object' || data === null) return data;
  
  const masked = { ...data };
  const sensitiveFields = [
    'password', 'password_hash', 'token', 'refresh_token',
    'email', 'phone_number', 'credit_card', 'cvv', 'ssn',
    'api_key', 'secret', 'authorization', 'cookie'
  ];
  
  Object.keys(masked).forEach(key => {
    const keyLower = key.toLowerCase();
    
    // Check if this field contains sensitive data
    if (sensitiveFields.some(field => keyLower.includes(field))) {
      if (typeof masked[key] === 'string' && masked[key].length > 4) {
        masked[key] = `${masked[key].substring(0, 2)}***${masked[key].substring(masked[key].length - 2)}`;
      } else if (masked[key]) {
        masked[key] = '***';
      }
    }
    
    // Recursively mask nested objects
    if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveLogData(masked[key]);
    }
  });
  
  return masked;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'hotel-management-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test'
    }),
    
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // HTTP request logs
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    }),
    
    // Audit logs
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'audit',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Custom audit log level
logger.audit = function(message, meta = {}) {
  this.log('audit', message, meta);
};

// Custom HTTP log method
logger.http = function(req, res, responseTime) {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    userType: req.user?.type || 'guest'
  };
  
  // Don't log sensitive endpoints
  const sensitiveEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/password-reset'];
  if (sensitiveEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
    logData.url = '***';
  }
  
  this.log('http', 'HTTP Request', logData);
};

// Log database queries
logger.dbQuery = function(query, params, executionTime, error = null) {
  const logData = {
    query: query.length > 500 ? `${query.substring(0, 500)}...` : query,
    params: maskSensitiveLogData(params),
    executionTime: `${executionTime}ms`,
    error: error ? error.message : null
  };
  
  if (error) {
    this.error('Database query error', logData);
  } else if (executionTime > 1000) {
    this.warn('Slow database query', logData);
  } else if (process.env.LOG_LEVEL === 'debug') {
    this.debug('Database query', logData);
  }
};

// Log subscription events
logger.subscription = function(event, hotelId, userId, details = {}) {
  this.audit(`Subscription ${event}`, {
    hotelId,
    userId,
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Log security events
logger.security = function(event, level = 'info', details = {}) {
  const logMethod = level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info';
  
  this[logMethod](`Security: ${event}`, {
    event,
    ...details,
    ip: details.ip || 'unknown',
    timestamp: new Date().toISOString()
  });
};

// Log business events
logger.business = function(event, entity, entityId, userId, details = {}) {
  this.info(`Business: ${event}`, {
    event,
    entity,
    entityId,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Export logger
module.exports = logger;

// Also export a stream for morgan
module.exports.stream = {
  write: function(message) {
    logger.http(message.trim());
  }
};