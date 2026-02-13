/**
 * User Performance Metrics Model
 * ===============================
 * Stores computed performance data for the Adaptive Difficulty Recommendation Engine.
 *
 * ALGORITHM EXPLANATION:
 * ─────────────────────
 * performanceScore = (accuracy × 0.4) + (speedScore × 0.3) + (consistencyScore × 0.3)
 *
 * Where:
 *   accuracy       = (correct submissions / total submissions) × 100
 *   speedScore     = max(0, 100 - (avgSolveTime / expectedTime) × 50)
 *   consistencyScore = based on streak and daily solve frequency
 *
 * Difficulty Progression Rules:
 *   - Score ≥ 70 on Easy   → suggest Medium
 *   - Score ≥ 70 on Medium → suggest Hard
 *   - Score < 40 on current → suggest lower difficulty
 *   - Weak topics (< 50% accuracy) get prioritized in recommendations
 *
 * RESEARCH CONTRIBUTION:
 * This implements a simplified Item Response Theory (IRT) model commonly
 * used in Computer Adaptive Testing (CAT) systems, adapted for coding
 * problem recommendation in an interview preparation context.
 */

const mongoose = require("mongoose");

const topicStrengthSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    accuracy: { type: Number, default: 0 },       // 0-100 percentage
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    avgSolveTime: { type: Number, default: 0 },    // in milliseconds
    lastAttempted: { type: Date },
}, { _id: false });

const difficultyHistorySchema = new mongoose.Schema({
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    score: { type: Number },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
}, { _id: false });

const userPerformanceMetricsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        // ── Core Performance Metrics ──
        performanceScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        accuracy: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        avgSolveTime: {
            type: Number,
            default: 0,   // in milliseconds
        },

        // ── Submission Statistics ──
        totalSubmissions: { type: Number, default: 0 },
        correctSubmissions: { type: Number, default: 0 },
        solvedByDifficulty: {
            Easy: { type: Number, default: 0 },
            Medium: { type: Number, default: 0 },
            Hard: { type: Number, default: 0 },
        },

        // ── Topic-Level Analysis ──
        topicStrengths: [topicStrengthSchema],

        // ── Difficulty Progression ──
        currentRecommendedDifficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },
        difficultyHistory: [difficultyHistorySchema],

        // ── Velocity & Consistency ──
        solveVelocity: {
            type: Number,  // problems per day (7-day rolling average)
            default: 0,
        },
        consistencyScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // ── Timestamps ──
        lastCalculated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// ── Performance Indexes ──
userPerformanceMetricsSchema.index({ userId: 1 });
userPerformanceMetricsSchema.index({ performanceScore: -1 });
userPerformanceMetricsSchema.index({ currentRecommendedDifficulty: 1 });
userPerformanceMetricsSchema.index({ "topicStrengths.topic": 1 });

module.exports = mongoose.model("UserPerformanceMetrics", userPerformanceMetricsSchema);
