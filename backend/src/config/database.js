

const { Pool } = require('pg');
const  logger  = require('../utils/logger.js');

class Database {
  constructor() {

    const isProduction = process.env.NODE_ENV === 'production';

const sslConfig = isProduction
  ? (process.env.DB_SSL_CA
      ? {
          rejectUnauthorized: true,
          ca: Buffer.from(process.env.DB_SSL_CA, 'base64').toString('utf8'),
        }
      : {
          rejectUnauthorized: false, // ✅ Render-safe
        })
  : false;


    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      user: "postgres",
      password: "justopenit",
      database: "test",
      
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000,
      
      // SSL for production
      ssl: sslConfig,
      
      // Query timeout (prevent long-running queries)
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
      
      // Application name for monitoring
      application_name: process.env.APP_NAME || 'hotel-saas-api'
    });

    // Event listeners
    this.pool.on('connect', () => {
      logger.info('Database connection established');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
      // In production, you might want to restart the pool or alert
      if (isProduction) {
        // Implement alerting logic here (e.g., send to Sentry, email, etc.)
      }
    });

    this.pool.on('remove', () => {
      logger.info('Database connection removed');
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > parseInt(process.env.DB_SLOW_QUERY_THRESHOLD, 10) || 1000) {
        logger.warn('Slow query detected', {
          query: text,
          duration,
          rows: res.rowCount
        });
      }
      
      logger.debug('Query executed', {
        query: text,
        duration,
        rows: res.rowCount
      });
      
      return res;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query execution failed', {
        query: text,
        params,
        duration,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Re-throw with sanitized error for production
      if (process.env.NODE_ENV === 'production') {
        const sanitizedError = new Error('Database query failed');
        sanitizedError.code = error.code;
        throw sanitizedError;
      }
      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    
    // Monkey patch the query method to log queries from this client
    const originalQuery = client.query;
    const originalRelease = client.release;
    const releaseTimeout = 10000; // 10 seconds
    
    // Set a timeout to detect client leaks
    const timeout = setTimeout(() => {
      logger.error('Database client has been checked out for too long!', {
        releaseTimeout
      });
    }, releaseTimeout);
    
    client.query = (...args) => {
      const start = Date.now();
      return originalQuery.apply(client, args)
        .then((result) => {
          const duration = Date.now() - start;
          logger.debug('Client query executed', { duration });
          return result;
        })
        .catch((error) => {
          logger.error('Client query failed', { error: error.message });
          throw error;
        });
    };
    
    client.release = () => {
      clearTimeout(timeout);
      client.query = originalQuery;
      client.release = originalRelease;
      return originalRelease.call(client);
    };
    
    return client;
  }

  async healthCheck() {
    try {
      await this.pool.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  async close() {
    try {
      await this.pool.end();
      logger.info('Database pool closed gracefully');
    } catch (error) {
      logger.error('Error closing database pool:', error);
      throw error;
    }
  }
}

// Singleton instance
const database = new Database();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database pool...');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database pool...');
  await database.close();
  process.exit(0);
});

module.exports = database;