/**
 * System Metrics Model
 * ====================
 * Stores daily aggregated system performance data for monitoring.
 * One document per day — upserted via systemMetricsService.
 *
 * Data collected via responseTimeMiddleware.js and flushed periodically.
 */

const mongoose = require("mongoose");

const endpointMetricSchema = new mongoose.Schema({
    route: { type: String, required: true },
    method: { type: String, required: true },
    totalCalls: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    maxResponseTime: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
}, { _id: false });

const systemMetricsSchema = new mongoose.Schema(
    {
        date: {
            type: String,     // "YYYY-MM-DD" format for easy grouping
            required: true,
            unique: true,
        },

        // ── API Statistics ──
        totalApiCalls: {
            type: Number,
            default: 0,
        },
        avgResponseTime: {
            type: Number,     // in milliseconds
            default: 0,
        },
        maxResponseTime: {
            type: Number,
            default: 0,
        },

        // ── Error Tracking ──
        errorCount: {
            type: Number,
            default: 0,
        },
        errorRate: {
            type: Number,     // percentage
            default: 0,
        },
        statusCodeBreakdown: {
            "2xx": { type: Number, default: 0 },
            "3xx": { type: Number, default: 0 },
            "4xx": { type: Number, default: 0 },
            "5xx": { type: Number, default: 0 },
        },

        // ── Session Data ──
        dailyActiveSessions: {
            type: Number,
            default: 0,
        },
        uniqueUsers: {
            type: Number,
            default: 0,
        },
        peakConcurrentUsers: {
            type: Number,
            default: 0,
        },

        // ── Server Health ──
        serverUptime: {
            type: Number,     // in seconds
            default: 0,
        },
        memoryUsage: {
            rss: { type: Number, default: 0 },
            heapTotal: { type: Number, default: 0 },
            heapUsed: { type: Number, default: 0 },
        },

        // ── Per-Endpoint Breakdown ──
        endpointMetrics: [endpointMetricSchema],
    },
    { timestamps: true }
);

// ── Indexes ──
systemMetricsSchema.index({ date: -1 });

module.exports = mongoose.model("SystemMetrics", systemMetricsSchema);
