/**
 * Environment Configuration
 * -------------------------
 * Centralized config switching based on NODE_ENV.
 * Import: const config = require("./config/environments");
 *
 * This provides a single source of truth for all environment-specific values.
 * Production values should be overridden via .env file.
 */

const config = {
    development: {
        port: parseInt(process.env.PORT) || 5000,
        mongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/interview-platform",
        redisURL: process.env.REDIS_URL || "redis://localhost:6379",
        jwtSecret: process.env.JWT_SECRET || "codeinterview_jwt_secret_key_2026",
        jwtExpiresIn: "7d",
        corsOrigins: ["http://localhost:5173", "http://localhost:3000"],
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 200, // More lenient for dev
        logLevel: "debug",
    },
    production: {
        port: parseInt(process.env.PORT) || 5000,
        mongoURI: process.env.MONGODB_URI || "mongodb://mongo:27017/interview-platform",
        redisURL: process.env.REDIS_URL || "redis://redis:6379",
        jwtSecret: process.env.JWT_SECRET, // MUST be set in production
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
        corsOrigins: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
        rateLimitWindow: 15 * 60 * 1000,
        rateLimitMax: 100, // Stricter in prod
        logLevel: "info",
    },
    test: {
        port: 5001,
        mongoURI: process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/interview-platform-test",
        redisURL: process.env.REDIS_URL || "redis://localhost:6379",
        jwtSecret: "test_secret_key",
        jwtExpiresIn: "1h",
        corsOrigins: ["http://localhost:5173"],
        rateLimitWindow: 15 * 60 * 1000,
        rateLimitMax: 1000,
        logLevel: "warn",
    },
};

const env = process.env.NODE_ENV || "development";

module.exports = config[env] || config.development;
