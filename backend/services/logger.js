/**
 * Winston Logger Service
 * ---------------------
 * Centralized logging with environment-aware transports.
 * - Development: colorized console output
 * - Production: JSON file output + console
 *
 * Usage: const logger = require("./services/logger");
 *        logger.info("Server started", { port: 5000 });
 *        logger.error("DB failed", { error: err.message });
 */

const winston = require("winston");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

// Custom format for development (colorized, readable)
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

// Custom format for production (JSON, structured)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const transports = [
    new winston.transports.Console({
        format: isProduction ? prodFormat : devFormat,
    }),
];

// In production, also log to files
if (isProduction) {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        })
    );
}

const logger = winston.createLogger({
    level: isProduction ? "info" : "debug",
    format: isProduction ? prodFormat : devFormat,
    transports,
    // Don't exit on uncaught errors
    exitOnError: false,
});

module.exports = logger;
