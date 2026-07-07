// Replace your DB config file with this.
// This removes hardcoded postgres / justopenit / test
// and uses your .env values.

const path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

const { Pool } = require("pg");
const logger = require("../utils/logger.js");

class Database {
  constructor() {
    const useSSL = process.env.DB_SSL === "true";

    const sslConfig = useSSL
      ? process.env.DB_SSL_CA
        ? {
            rejectUnauthorized: true,
            ca: Buffer.from(process.env.DB_SSL_CA, "base64").toString("utf8"),
          }
        : {
            rejectUnauthorized: false,
          }
      : false;

    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),

      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      max: Number(process.env.DB_POOL_MAX || 20),
      min: Number(process.env.DB_POOL_MIN || 2),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT || 30000),
      connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT || 5000
      ),

      ssl: sslConfig,

      statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT || 30000),
      application_name: process.env.APP_NAME || "cafesync-api",
    });

    this.pool.on("connect", () => {
      logger.info("Database connection established");
    });

    this.pool.on("error", (err) => {
      logger.error("Unexpected database pool error:", err);
    });

    this.pool.on("remove", () => {
      logger.info("Database connection removed");
    });
  }

  async query(text, params) {
    const start = Date.now();

    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;

      const slowQueryThreshold = Number(
        process.env.DB_SLOW_QUERY_THRESHOLD || 1000
      );

      if (duration > slowQueryThreshold) {
        logger.warn("Slow query detected", {
          query: text,
          duration,
          rows: res.rowCount,
        });
      }

      logger.debug("Query executed", {
        query: text,
        duration,
        rows: res.rowCount,
      });

      return res;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error("Query execution failed", {
        query: text,
        params,
        duration,
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });

      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();

    const originalQuery = client.query;
    const originalRelease = client.release;
    const releaseTimeout = Number(process.env.DB_CLIENT_RELEASE_TIMEOUT || 10000);

    const timeout = setTimeout(() => {
      logger.error("Database client has been checked out for too long!", {
        releaseTimeout,
      });
    }, releaseTimeout);

    client.query = (...args) => {
      const start = Date.now();

      return originalQuery
        .apply(client, args)
        .then((result) => {
          const duration = Date.now() - start;
          logger.debug("Client query executed", { duration });
          return result;
        })
        .catch((error) => {
          logger.error("Client query failed", { error: error.message });
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
      await this.pool.query("SELECT 1");
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Database health check failed:", error);

      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async close() {
    try {
      await this.pool.end();
      logger.info("Database pool closed gracefully");
    } catch (error) {
      logger.error("Error closing database pool:", error);
      throw error;
    }
  }
}

const database = new Database();

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing database pool...");
  await database.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing database pool...");
  await database.close();
  process.exit(0);
});

module.exports = database;