/**
 * Config Service
 * ==============
 * Production-ready config validation layer.
 * Validates required environment variables at startup and provides
 * typed access with defaults.
 */

const logger = require("./logger");

class ConfigService {
    constructor() {
        this.config = {};
        this.warnings = [];
    }

    /**
     * Validate and load all config from environment.
     * Call during server startup. Logs warnings for missing optional vars
     * and throws for missing required vars (in production).
     */
    validate() {
        const env = process.env.NODE_ENV || "development";
        const isProduction = env === "production";

        // Required in all environments
        this._require("MONGODB_URI", process.env.MONGODB_URI, "mongodb://localhost:27017/interview-platform");
        this._require("JWT_SECRET", process.env.JWT_SECRET, isProduction ? null : "codeinterview_jwt_secret_key_2026");

        // Required in production
        if (isProduction) {
            this._require("CORS_ORIGINS", process.env.CORS_ORIGINS);
        }

        // Optional with defaults
        this._optional("PORT", process.env.PORT, "5000");
        this._optional("NODE_ENV", env, "development");
        this._optional("REDIS_URL", process.env.REDIS_URL, "redis://localhost:6379");
        this._optional("GEMINI_API_KEY", process.env.GEMINI_API_KEY, "");
        this._optional("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY, "");
        this._optional("JWT_EXPIRES_IN", process.env.JWT_EXPIRES_IN, "7d");
        this._optional("RATE_LIMIT_WINDOW", process.env.RATE_LIMIT_WINDOW, "900000"); // 15 min
        this._optional("RATE_LIMIT_MAX", process.env.RATE_LIMIT_MAX, "200");
        this._optional("LOG_LEVEL", process.env.LOG_LEVEL, "info");

        // Log results
        if (this.warnings.length > 0) {
            logger.warn("Config warnings:", { warnings: this.warnings });
        }

        logger.info(`Config validated for [${env}] — ${Object.keys(this.config).length} variables loaded`);

        return this.config;
    }

    _require(name, value, defaultValue = null) {
        if (!value && !defaultValue) {
            const msg = `FATAL: Required env var ${name} is not set!`;
            logger.error(msg);
            throw new Error(msg);
        }
        this.config[name] = value || defaultValue;
        if (!value && defaultValue) {
            this.warnings.push(`${name} not set, using default`);
        }
    }

    _optional(name, value, defaultValue) {
        this.config[name] = value || defaultValue;
        if (!value) {
            this.warnings.push(`${name} not set, using default: ${defaultValue || "(empty)"}`);
        }
    }

    get(name) {
        return this.config[name];
    }

    getInt(name) {
        return parseInt(this.config[name], 10);
    }

    getBool(name) {
        return this.config[name] === "true" || this.config[name] === true;
    }
}

module.exports = new ConfigService();
