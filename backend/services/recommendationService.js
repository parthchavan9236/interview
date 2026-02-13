/**
 * Recommendation Service — Adaptive Difficulty Engine
 * ====================================================
 * Implements a scoring algorithm inspired by Item Response Theory (IRT)
 * to dynamically recommend problems based on user performance.
 *
 * ALGORITHM:
 * ──────────
 * performanceScore = (accuracy × 0.4) + (speedScore × 0.3) + (consistencyScore × 0.3)
 *
 * Difficulty Progression:
 *   Easy → Medium:   performanceScore ≥ 70 AND solvedEasy ≥ 5
 *   Medium → Hard:   performanceScore ≥ 70 AND solvedMedium ≥ 3
 *   Medium → Easy:   performanceScore < 40 (3 consecutive failures)
 *   Hard → Medium:   performanceScore < 40 (3 consecutive failures)
 *
 * Weak Topic Detection:
 *   Topic accuracy < 50% AND attempts ≥ 3 → flagged as weak
 *   Recommendations prioritize weak topics to improve well-roundedness
 */

const UserPerformanceMetrics = require("../models/UserPerformanceMetrics");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

class RecommendationService {
    /**
     * Update performance metrics after a new submission.
     * Called after each successful code submission.
     *
     * @param {string} userId
     * @param {Object} submission - The submission document
     * @param {Object} problem - The problem document
     */
    async updateMetrics(userId, submission, problem) {
        let metrics = await UserPerformanceMetrics.findOne({ userId });

        if (!metrics) {
            metrics = new UserPerformanceMetrics({ userId });
        }

        // Update submission counts
        metrics.totalSubmissions += 1;
        if (submission.status === "accepted") {
            metrics.correctSubmissions += 1;
            const diff = problem.difficulty;
            metrics.solvedByDifficulty[diff] = (metrics.solvedByDifficulty[diff] || 0) + 1;
        }

        // Update accuracy
        metrics.accuracy = metrics.totalSubmissions > 0
            ? (metrics.correctSubmissions / metrics.totalSubmissions) * 100
            : 0;

        // Update average solve time (exponential moving average)
        if (submission.executionTime > 0) {
            const alpha = 0.3; // smoothing factor
            metrics.avgSolveTime = metrics.avgSolveTime === 0
                ? submission.executionTime
                : alpha * submission.executionTime + (1 - alpha) * metrics.avgSolveTime;
        }

        // Update topic strengths
        if (problem.tags && problem.tags.length > 0) {
            for (const tag of problem.tags) {
                let topicEntry = metrics.topicStrengths.find(t => t.topic === tag);
                if (!topicEntry) {
                    metrics.topicStrengths.push({
                        topic: tag,
                        accuracy: 0,
                        totalAttempts: 0,
                        correctAttempts: 0,
                        avgSolveTime: 0,
                        lastAttempted: new Date(),
                    });
                    topicEntry = metrics.topicStrengths[metrics.topicStrengths.length - 1];
                }

                topicEntry.totalAttempts += 1;
                if (submission.status === "accepted") {
                    topicEntry.correctAttempts += 1;
                }
                topicEntry.accuracy = topicEntry.totalAttempts > 0
                    ? (topicEntry.correctAttempts / topicEntry.totalAttempts) * 100
                    : 0;
                topicEntry.lastAttempted = new Date();

                if (submission.executionTime > 0) {
                    const alpha = 0.3;
                    topicEntry.avgSolveTime = topicEntry.avgSolveTime === 0
                        ? submission.executionTime
                        : alpha * submission.executionTime + (1 - alpha) * topicEntry.avgSolveTime;
                }
            }
        }

        // Recalculate performance score
        metrics.performanceScore = this._calculatePerformanceScore(metrics);

        // Update difficulty progression
        const newDifficulty = this._determineRecommendedDifficulty(metrics);
        if (newDifficulty !== metrics.currentRecommendedDifficulty) {
            metrics.difficultyHistory.push({
                difficulty: newDifficulty,
                score: metrics.performanceScore,
                changedAt: new Date(),
                reason: `Performance score ${metrics.performanceScore.toFixed(1)} triggered progression`,
            });
            metrics.currentRecommendedDifficulty = newDifficulty;
        }

        // Calculate solve velocity (7-day rolling average)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = await Submission.countDocuments({
            user: userId,
            status: "accepted",
            createdAt: { $gte: sevenDaysAgo },
        });
        metrics.solveVelocity = parseFloat((recentCount / 7).toFixed(2));

        metrics.lastCalculated = new Date();
        await metrics.save();

        return metrics;
    }

    /**
     * Calculate composite performance score.
     *
     * Formula: performanceScore = accuracy × 0.4 + speedScore × 0.3 + consistencyScore × 0.3
     *
     * @param {Object} metrics - UserPerformanceMetrics document
     * @returns {number} Score between 0-100
     */
    _calculatePerformanceScore(metrics) {
        // Accuracy component (0-100)
        const accuracyScore = metrics.accuracy;

        // Speed component — normalize against expected solve time (5 min = 300000ms)
        const expectedTime = 300000; // 5 minutes
        const speedScore = metrics.avgSolveTime > 0
            ? Math.max(0, 100 - (metrics.avgSolveTime / expectedTime) * 50)
            : 50; // neutral if no data

        // Consistency component — based on solve velocity
        const consistencyScore = Math.min(100, metrics.solveVelocity * 33.3); // 3 problems/day = 100

        return parseFloat(
            (accuracyScore * 0.4 + speedScore * 0.3 + consistencyScore * 0.3).toFixed(2)
        );
    }

    /**
     * Determine recommended difficulty based on current performance.
     *
     * Progression rules:
     *   Score ≥ 70 on Easy   → Medium (if ≥ 5 Easy solved)
     *   Score ≥ 70 on Medium → Hard   (if ≥ 3 Medium solved)
     *   Score < 40           → drop one level
     *
     * @param {Object} metrics
     * @returns {string} "Easy" | "Medium" | "Hard"
     */
    _determineRecommendedDifficulty(metrics) {
        const score = metrics.performanceScore;
        const current = metrics.currentRecommendedDifficulty;
        const solved = metrics.solvedByDifficulty;

        // Promote
        if (score >= 70) {
            if (current === "Easy" && (solved.Easy || 0) >= 5) return "Medium";
            if (current === "Medium" && (solved.Medium || 0) >= 3) return "Hard";
        }

        // Demote
        if (score < 40) {
            if (current === "Hard") return "Medium";
            if (current === "Medium") return "Easy";
        }

        return current;
    }

    /**
     * Get personalized problem recommendations.
     *
     * Strategy:
     * 1. 60% problems at recommended difficulty + weak topics
     * 2. 30% problems at recommended difficulty + random topics
     * 3. 10% stretch problems (one level harder)
     *
     * @param {string} userId
     * @param {number} limit - Number of recommendations
     * @returns {Array} Recommended problems
     */
    async getRecommendations(userId, limit = 10) {
        const metrics = await UserPerformanceMetrics.findOne({ userId });
        const user = await require("../models/User").findById(userId);
        const solvedIds = user?.solvedProblems || [];

        const difficulty = metrics?.currentRecommendedDifficulty || "Easy";

        // Identify weak topics (accuracy < 50% with ≥ 3 attempts)
        const weakTopics = (metrics?.topicStrengths || [])
            .filter(t => t.accuracy < 50 && t.totalAttempts >= 3)
            .map(t => t.topic);

        const results = [];

        // 1. Weak topic problems (60% of limit)
        if (weakTopics.length > 0) {
            const weakProblems = await Problem.find({
                _id: { $nin: solvedIds },
                isDeleted: { $ne: true },
                difficulty,
                tags: { $in: weakTopics },
            }).limit(Math.ceil(limit * 0.6)).lean();
            results.push(...weakProblems);
        }

        // 2. General problems at recommended difficulty (fill remaining)
        const remaining = limit - results.length;
        if (remaining > 0) {
            const existingIds = results.map(r => r._id);
            const generalProblems = await Problem.find({
                _id: { $nin: [...solvedIds, ...existingIds] },
                isDeleted: { $ne: true },
                difficulty,
            }).limit(Math.ceil(remaining * 0.75)).lean();
            results.push(...generalProblems);
        }

        // 3. Stretch problems (one level harder)
        const stretchRemaining = limit - results.length;
        if (stretchRemaining > 0) {
            const stretchDiff = difficulty === "Easy" ? "Medium" : "Hard";
            const existingIds = results.map(r => r._id);
            const stretchProblems = await Problem.find({
                _id: { $nin: [...solvedIds, ...existingIds] },
                isDeleted: { $ne: true },
                difficulty: stretchDiff,
            }).limit(stretchRemaining).lean();
            results.push(...stretchProblems);
        }

        return {
            recommendations: results.slice(0, limit),
            metrics: metrics ? {
                performanceScore: metrics.performanceScore,
                accuracy: metrics.accuracy,
                currentDifficulty: metrics.currentRecommendedDifficulty,
                weakTopics,
                solveVelocity: metrics.solveVelocity,
            } : null,
        };
    }

    /**
     * Get full performance stats for a user.
     */
    async getPerformanceStats(userId) {
        const metrics = await UserPerformanceMetrics.findOne({ userId });
        if (!metrics) {
            return {
                performanceScore: 0,
                accuracy: 0,
                avgSolveTime: 0,
                totalSubmissions: 0,
                correctSubmissions: 0,
                solvedByDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
                topicStrengths: [],
                currentRecommendedDifficulty: "Easy",
                solveVelocity: 0,
                consistencyScore: 0,
            };
        }
        return metrics.toJSON();
    }
}

module.exports = new RecommendationService();
