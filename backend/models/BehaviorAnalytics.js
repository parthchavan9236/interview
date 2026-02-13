/**
 * Behavior Analytics Model
 * ========================
 * Tracks user behavior during coding sessions to:
 *   1. Compute an Interview Readiness Score
 *   2. Detect suspicious activity (plagiarism indicators)
 *   3. Provide actionable insights for interview preparation
 *
 * RESEARCH CONTRIBUTION:
 * Behavioral biometrics (typing patterns, idle detection, tab-switching)
 * are emerging indicators in remote proctoring systems. This model
 * implements a lightweight behavioral fingerprinting approach suitable
 * for academic research on remote interview integrity.
 */

const mongoose = require("mongoose");

const behaviorAnalyticsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
        },
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
        },
        sessionType: {
            type: String,
            enum: ["practice", "contest", "interview"],
            default: "practice",
        },

        // ── Typing Behavior ──
        typingSpeed: {
            type: Number,      // characters per minute
            default: 0,
        },
        keystrokeCount: {
            type: Number,
            default: 0,
        },
        deleteCount: {
            type: Number,      // backspace/delete presses
            default: 0,
        },

        // ── Focus Tracking ──
        idleTime: {
            type: Number,      // total idle seconds
            default: 0,
        },
        tabSwitchCount: {
            type: Number,
            default: 0,
        },
        focusLostEvents: {
            type: Number,      // window blur events
            default: 0,
        },

        // ── Copy/Paste Detection ──
        copyPasteDetected: {
            type: Boolean,
            default: false,
        },
        copyPasteCount: {
            type: Number,
            default: 0,
        },
        pastedContentLength: {
            type: Number,      // total chars pasted
            default: 0,
        },

        // ── Submission Patterns ──
        submissionIntervals: [{
            type: Number,      // seconds between submissions
        }],
        totalSubmissions: {
            type: Number,
            default: 0,
        },

        // ── Session Duration ──
        sessionStartTime: {
            type: Date,
            default: Date.now,
        },
        sessionEndTime: {
            type: Date,
        },
        totalDuration: {
            type: Number,      // in seconds
            default: 0,
        },

        // ── Computed Scores ──
        interviewReadinessScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // ── Suspicious Activity Flags ──
        suspiciousFlags: [{
            type: String,
            enum: [
                "excessive_tab_switching",
                "rapid_paste_detected",
                "abnormal_typing_pattern",
                "minimal_keystroke_activity",
                "submission_burst",
                "extended_idle",
            ],
        }],
        riskLevel: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
    },
    { timestamps: true }
);

// ── Indexes ──
behaviorAnalyticsSchema.index({ userId: 1, createdAt: -1 });
behaviorAnalyticsSchema.index({ sessionId: 1 }, { unique: true });
behaviorAnalyticsSchema.index({ userId: 1, sessionType: 1 });
behaviorAnalyticsSchema.index({ riskLevel: 1 });
behaviorAnalyticsSchema.index({ problemId: 1 });

module.exports = mongoose.model("BehaviorAnalytics", behaviorAnalyticsSchema);
