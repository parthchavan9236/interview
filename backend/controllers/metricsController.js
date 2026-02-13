/**
 * System Metrics Controller
 * =========================
 * Admin-only endpoints for system monitoring and performance stats.
 */

const SystemMetrics = require("../models/SystemMetrics");
const systemMetricsService = require("../services/systemMetricsService");
const cacheService = require("../services/cacheService");
const mongoose = require("mongoose");

/**
 * GET /api/metrics/system
 * Get system health and current metrics.
 */
exports.getSystemHealth = async (req, res) => {
    try {
        const health = systemMetricsService.getCurrentHealth();
        const cacheStats = cacheService.getStats();
        const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

        // Get today's metrics
        const today = new Date().toISOString().split("T")[0];
        const todayMetrics = await SystemMetrics.findOne({ date: today }).lean();

        res.json({
            success: true,
            data: {
                status: "healthy",
                server: health,
                database: {
                    status: dbStatus,
                    name: mongoose.connection.name,
                    host: mongoose.connection.host,
                },
                cache: cacheStats,
                today: todayMetrics || { totalApiCalls: 0, errorCount: 0 },
            },
        });
    } catch (error) {
        console.error("System health error:", error.message);
        res.status(500).json({ message: "Failed to get system health", error: error.message });
    }
};

/**
 * GET /api/metrics/performance
 * Get historical API performance statistics.
 */
exports.getPerformanceStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split("T")[0];

        const metrics = await SystemMetrics.find({
            date: { $gte: startDateStr },
        })
            .sort({ date: -1 })
            .lean();

        // Aggregate totals
        const totals = metrics.reduce(
            (acc, m) => ({
                totalCalls: acc.totalCalls + m.totalApiCalls,
                totalErrors: acc.totalErrors + m.errorCount,
                avgResponse: acc.avgResponse + m.avgResponseTime,
            }),
            { totalCalls: 0, totalErrors: 0, avgResponse: 0 }
        );

        if (metrics.length > 0) {
            totals.avgResponse = parseFloat((totals.avgResponse / metrics.length).toFixed(2));
        }
        totals.errorRate = totals.totalCalls > 0
            ? parseFloat(((totals.totalErrors / totals.totalCalls) * 100).toFixed(2))
            : 0;

        res.json({
            success: true,
            data: {
                period: `${days} days`,
                totals,
                daily: metrics,
            },
        });
    } catch (error) {
        console.error("Performance stats error:", error.message);
        res.status(500).json({ message: "Failed to get performance stats", error: error.message });
    }
};

/**
 * GET /api/metrics/endpoints
 * Get per-endpoint performance breakdown (most recent day).
 */
exports.getEndpointStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const metrics = await SystemMetrics.findOne({ date: today }).lean();

        if (!metrics || !metrics.endpointMetrics) {
            return res.json({ success: true, data: [] });
        }

        // Sort by total calls descending
        const sorted = metrics.endpointMetrics.sort((a, b) => b.totalCalls - a.totalCalls);

        res.json({ success: true, data: sorted });
    } catch (error) {
        console.error("Endpoint stats error:", error.message);
        res.status(500).json({ message: "Failed to get endpoint stats", error: error.message });
    }
};
