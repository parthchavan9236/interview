/**
 * Recommendation Controller
 * =========================
 * API layer for the Adaptive Difficulty Recommendation Engine.
 */

const recommendationService = require("../services/recommendationService");
const UserPerformanceMetrics = require("../models/UserPerformanceMetrics");

/**
 * GET /api/recommendations
 * Get personalized problem recommendations for the authenticated user.
 */
exports.getRecommendations = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await recommendationService.getRecommendations(req.user._id, limit);

        res.json({
            success: true,
            data: result.recommendations,
            metrics: result.metrics,
            count: result.recommendations.length,
        });
    } catch (error) {
        console.error("Recommendation error:", error.message);
        res.status(500).json({ message: "Failed to get recommendations", error: error.message });
    }
};

/**
 * GET /api/recommendations/stats
 * Get performance metrics and stats for the authenticated user.
 */
exports.getPerformanceStats = async (req, res) => {
    try {
        const stats = await recommendationService.getPerformanceStats(req.user._id);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("Performance stats error:", error.message);
        res.status(500).json({ message: "Failed to get performance stats", error: error.message });
    }
};

/**
 * POST /api/recommendations/recalculate
 * Force recalculation of user metrics (admin or self).
 */
exports.recalculate = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        const Submission = require("../models/Submission");
        const Problem = require("../models/Problem");

        // Get all submissions for user
        const submissions = await Submission.find({ user: userId }).sort({ createdAt: 1 });

        if (submissions.length === 0) {
            return res.json({ success: true, message: "No submissions found", data: null });
        }

        // Reset metrics
        let metrics = await UserPerformanceMetrics.findOne({ userId });
        if (!metrics) {
            metrics = new UserPerformanceMetrics({ userId });
        }

        // Recalculate from all submissions
        for (const sub of submissions) {
            const problem = await Problem.findById(sub.problem);
            if (problem) {
                await recommendationService.updateMetrics(userId, sub, problem);
            }
        }

        const updated = await UserPerformanceMetrics.findOne({ userId });
        res.json({ success: true, message: "Metrics recalculated", data: updated });
    } catch (error) {
        console.error("Recalculate error:", error.message);
        res.status(500).json({ message: "Failed to recalculate", error: error.message });
    }
};
