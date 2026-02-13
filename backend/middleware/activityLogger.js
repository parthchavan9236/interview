const AuditLog = require("../models/AuditLog");

/**
 * Middleware: Extracts client info (IP, device) and attaches to req.clientInfo.
 * Must be placed AFTER body parsers, BEFORE route handlers.
 */
const extractClientInfo = (req, res, next) => {
    req.clientInfo = {
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown",
        deviceInfo: req.headers["user-agent"] || "unknown",
    };
    next();
};

/**
 * Log an activity to the AuditLog collection.
 * Can be called from any controller after an important action.
 *
 * @param {Object} params
 * @param {string} params.actionType - One of the AuditLog enum values
 * @param {string} params.performedBy - User ObjectId
 * @param {string} [params.targetId] - Target document ObjectId
 * @param {string} [params.targetModel] - Target model name
 * @param {string} [params.ipAddress] - Client IP
 * @param {string} [params.deviceInfo] - User-Agent
 * @param {Object} [params.metadata] - Extra data about the action
 */
const logActivity = async ({ actionType, performedBy, targetId, targetModel, ipAddress, deviceInfo, metadata }) => {
    try {
        await AuditLog.create({
            actionType,
            performedBy,
            targetId: targetId || null,
            targetModel: targetModel || null,
            ipAddress: ipAddress || "",
            deviceInfo: deviceInfo || "",
            metadata: metadata || {},
        });
    } catch (error) {
        // Logging should never crash the app — fail silently
        console.error("AuditLog write failed:", error.message);
    }
};

module.exports = { extractClientInfo, logActivity };
