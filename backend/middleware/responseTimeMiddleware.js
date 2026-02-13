/**
 * Response Time Middleware
 * =======================
 * Intercepts every HTTP request to measure response time and feed
 * data to the SystemMetricsService for monitoring.
 *
 * This middleware wraps res.end() to capture the exact response time
 * and status code after the route handler completes.
 */

const systemMetricsService = require("../services/systemMetricsService");

const responseTimeMiddleware = (req, res, next) => {
    const startTime = process.hrtime.bigint();

    // Save original end function
    const originalEnd = res.end;

    res.end = function (...args) {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1e6; // nanoseconds → milliseconds

        // Normalize route for aggregation (strip params)
        const route = req.route?.path || req.path || req.url;
        const normalizedRoute = route
            .replace(/\/[a-f0-9]{24}/g, "/:id")        // MongoDB ObjectIds
            .replace(/\/\d+/g, "/:num")                 // numeric params
            .replace(/\?.*$/, "");                       // strip query strings

        // Record in metrics service
        systemMetricsService.record({
            method: req.method,
            route: normalizedRoute,
            statusCode: res.statusCode,
            responseTime: parseFloat(responseTime.toFixed(2)),
            userId: req.user?._id || null,
        });

        // Call original end
        originalEnd.apply(this, args);
    };

    next();
};

module.exports = responseTimeMiddleware;
