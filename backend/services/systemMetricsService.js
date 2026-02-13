/**
 * System Metrics Service
 * ======================
 * In-memory counter that periodically flushes to MongoDB.
 * Captures API request counts, response times, error rates, and session data.
 *
 * ARCHITECTURE:
 * - Middleware records each request → in-memory buffer
 * - Every 5 minutes → flush aggregated data to SystemMetrics collection
 * - One document per day (upserted)
 *
 * SCALABILITY:
 * For clustered/multi-instance deployments, replace in-memory buffer
 * with Redis pub/sub or shared Redis counters, then aggregate in a
 * single worker process.
 */

const SystemMetrics = require("../models/SystemMetrics");
const logger = require("./logger");

class SystemMetricsService {
    constructor() {
        // In-memory buffer — flushed every FLUSH_INTERVAL_MS
        this.buffer = this._emptyBuffer();
        this.uniqueUserSet = new Set();

        this.FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
        this._flushTimer = null;
    }

    _emptyBuffer() {
        return {
            totalApiCalls: 0,
            responseTimes: [],
            errorCount: 0,
            statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
            endpoints: {},   // { "GET:/api/problems": { calls: 0, times: [], errors: 0 } }
        };
    }

    /**
     * Start the periodic flush timer.
     * Call this once during server startup.
     */
    start() {
        if (this._flushTimer) return;
        this._flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
        logger.info("SystemMetricsService started (flush interval: 5min)");
    }

    /**
     * Stop the flush timer (for graceful shutdown).
     */
    async stop() {
        if (this._flushTimer) {
            clearInterval(this._flushTimer);
            this._flushTimer = null;
        }
        await this.flush(); // final flush
        logger.info("SystemMetricsService stopped");
    }

    /**
     * Record a single API request.
     * Called from responseTimeMiddleware for every request.
     *
     * @param {Object} data
     * @param {string} data.method - HTTP method
     * @param {string} data.route - Matched route pattern
     * @param {number} data.statusCode - HTTP status code
     * @param {number} data.responseTime - Response time in ms
     * @param {string} [data.userId] - Authenticated user ID
     */
    record({ method, route, statusCode, responseTime, userId }) {
        this.buffer.totalApiCalls += 1;
        this.buffer.responseTimes.push(responseTime);

        // Categorize status code
        const category = `${Math.floor(statusCode / 100)}xx`;
        if (this.buffer.statusCodes[category] !== undefined) {
            this.buffer.statusCodes[category] += 1;
        }
        if (statusCode >= 400) {
            this.buffer.errorCount += 1;
        }

        // Per-endpoint tracking
        const key = `${method}:${route}`;
        if (!this.buffer.endpoints[key]) {
            this.buffer.endpoints[key] = { calls: 0, times: [], errors: 0 };
        }
        this.buffer.endpoints[key].calls += 1;
        this.buffer.endpoints[key].times.push(responseTime);
        if (statusCode >= 400) {
            this.buffer.endpoints[key].errors += 1;
        }

        // Track unique users
        if (userId) {
            this.uniqueUserSet.add(userId.toString());
        }
    }

    /**
     * Flush in-memory buffer to MongoDB.
     * Upserts a single document per day.
     */
    async flush() {
        if (this.buffer.totalApiCalls === 0) return;

        const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        const buf = this.buffer;

        try {
            // Calculate aggregates
            const avgResponseTime = buf.responseTimes.length > 0
                ? buf.responseTimes.reduce((a, b) => a + b, 0) / buf.responseTimes.length
                : 0;
            const maxResponseTime = buf.responseTimes.length > 0
                ? Math.max(...buf.responseTimes)
                : 0;
            const errorRate = buf.totalApiCalls > 0
                ? (buf.errorCount / buf.totalApiCalls) * 100
                : 0;

            // Build endpoint metrics array
            const endpointMetrics = Object.entries(buf.endpoints).map(([key, data]) => {
                const [method, route] = key.split(":");
                const avg = data.times.length > 0
                    ? data.times.reduce((a, b) => a + b, 0) / data.times.length
                    : 0;
                const max = data.times.length > 0 ? Math.max(...data.times) : 0;
                return {
                    route: route || "/",
                    method,
                    totalCalls: data.calls,
                    avgResponseTime: parseFloat(avg.toFixed(2)),
                    maxResponseTime: parseFloat(max.toFixed(2)),
                    errorCount: data.errors,
                };
            });

            const mem = process.memoryUsage();

            await SystemMetrics.findOneAndUpdate(
                { date: today },
                {
                    $inc: {
                        totalApiCalls: buf.totalApiCalls,
                        errorCount: buf.errorCount,
                        "statusCodeBreakdown.2xx": buf.statusCodes["2xx"],
                        "statusCodeBreakdown.3xx": buf.statusCodes["3xx"],
                        "statusCodeBreakdown.4xx": buf.statusCodes["4xx"],
                        "statusCodeBreakdown.5xx": buf.statusCodes["5xx"],
                    },
                    $set: {
                        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
                        maxResponseTime: parseFloat(maxResponseTime.toFixed(2)),
                        errorRate: parseFloat(errorRate.toFixed(2)),
                        uniqueUsers: this.uniqueUserSet.size,
                        serverUptime: Math.floor(process.uptime()),
                        memoryUsage: {
                            rss: Math.round(mem.rss / 1024 / 1024),
                            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
                            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                        },
                        endpointMetrics,
                    },
                },
                { upsert: true, new: true }
            );

            logger.debug(`SystemMetrics flushed: ${buf.totalApiCalls} calls, avg ${avgResponseTime.toFixed(1)}ms`);
        } catch (error) {
            logger.error("SystemMetrics flush error:", { error: error.message });
        }

        // Reset buffer (keep uniqueUserSet for daily tracking)
        this.buffer = this._emptyBuffer();
    }

    /**
     * Get current system health status.
     */
    getCurrentHealth() {
        const mem = process.memoryUsage();
        return {
            uptime: Math.floor(process.uptime()),
            memoryUsage: {
                rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
            },
            activeConnections: this.uniqueUserSet.size,
            bufferedCalls: this.buffer.totalApiCalls,
        };
    }
}

module.exports = new SystemMetricsService();
