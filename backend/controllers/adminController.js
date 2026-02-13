const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Submission = require("../models/Submission");
const { logActivity } = require("../middleware/activityLogger");

/**
 * GET /api/admin/audit-logs
 * Paginated audit trail. Admin only.
 */
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.actionType) filter.actionType = req.query.actionType;
        if (req.query.userId) filter.performedBy = req.query.userId;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("performedBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * POST /api/admin/flag-suspicious
 * Manually flag a submission or user as suspicious.
 */
const flagSuspiciousActivity = async (req, res) => {
    try {
        const { targetId, targetModel, reason } = req.body;

        if (!targetId || !targetModel || !reason) {
            return res.status(400).json({ message: "targetId, targetModel, and reason are required" });
        }

        await logActivity({
            actionType: "SUSPICIOUS_ACTIVITY",
            performedBy: req.user._id,
            targetId,
            targetModel,
            ipAddress: req.clientInfo?.ipAddress,
            deviceInfo: req.clientInfo?.deviceInfo,
            metadata: { reason, flaggedAt: new Date() },
        });

        // If targeting a submission, update its record
        if (targetModel === "Submission") {
            await Submission.findByIdAndUpdate(targetId, {
                $set: { isFlagged: true, flagReason: reason },
            });
        }

        // If targeting a user, update their record
        if (targetModel === "User") {
            await User.findByIdAndUpdate(targetId, {
                $set: { isFlagged: true },
            });
        }

        res.json({ message: "Activity flagged successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/admin/system-health
 * Extended system health metrics.
 */
const getSystemHealth = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const dbState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting
        const memUsage = process.memoryUsage();

        res.json({
            status: dbState === 1 ? "healthy" : "degraded",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: {
                state: ["disconnected", "connected", "connecting", "disconnecting"][dbState],
            },
            memory: {
                rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            },
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || "development",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { getAuditLogs, flagSuspiciousActivity, getSystemHealth };
