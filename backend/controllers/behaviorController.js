/**
 * Behavior Analytics Controller
 * ==============================
 * Tracks user behavior during coding sessions and computes
 * interview readiness scores.
 */

const BehaviorAnalytics = require("../models/BehaviorAnalytics");

/**
 * POST /api/behavior/track
 * Record a behavior analytics event from the frontend.
 */
exports.trackBehavior = async (req, res) => {
    try {
        const {
            sessionId, problemId, sessionType,
            typingSpeed, keystrokeCount, deleteCount,
            idleTime, tabSwitchCount, focusLostEvents,
            copyPasteDetected, copyPasteCount, pastedContentLength,
            submissionIntervals, totalSubmissions,
            sessionEndTime, totalDuration,
        } = req.body;

        // Upsert — update if session exists, create if new
        const update = {
            userId: req.user._id,
            sessionId,
            ...(problemId && { problemId }),
            ...(sessionType && { sessionType }),
            ...(typingSpeed !== undefined && { typingSpeed }),
            ...(keystrokeCount !== undefined && { keystrokeCount }),
            ...(deleteCount !== undefined && { deleteCount }),
            ...(idleTime !== undefined && { idleTime }),
            ...(tabSwitchCount !== undefined && { tabSwitchCount }),
            ...(focusLostEvents !== undefined && { focusLostEvents }),
            ...(copyPasteDetected !== undefined && { copyPasteDetected }),
            ...(copyPasteCount !== undefined && { copyPasteCount }),
            ...(pastedContentLength !== undefined && { pastedContentLength }),
            ...(totalSubmissions !== undefined && { totalSubmissions }),
            ...(sessionEndTime && { sessionEndTime }),
            ...(totalDuration !== undefined && { totalDuration }),
        };

        if (submissionIntervals) {
            update.$push = { submissionIntervals: { $each: submissionIntervals } };
        }

        // Detect suspicious activity
        const suspiciousFlags = [];
        if (tabSwitchCount > 10) suspiciousFlags.push("excessive_tab_switching");
        if (copyPasteCount > 5) suspiciousFlags.push("rapid_paste_detected");
        if (keystrokeCount > 0 && typingSpeed > 500) suspiciousFlags.push("abnormal_typing_pattern");
        if (totalDuration > 60 && keystrokeCount < 10) suspiciousFlags.push("minimal_keystroke_activity");
        if (idleTime > totalDuration * 0.7) suspiciousFlags.push("extended_idle");

        update.suspiciousFlags = suspiciousFlags;
        update.riskLevel = suspiciousFlags.length >= 3 ? "high"
            : suspiciousFlags.length >= 1 ? "medium" : "low";

        // Compute interview readiness score
        //   Formula: 100 - penalties
        //   Penalties: tabSwitches (×2), idleRatio (×30), copyPaste (×10), lowKeystroke (×15)
        let readiness = 100;
        readiness -= Math.min(20, (tabSwitchCount || 0) * 2);
        if (totalDuration > 0) {
            readiness -= Math.min(30, ((idleTime || 0) / totalDuration) * 30);
        }
        readiness -= Math.min(20, (copyPasteCount || 0) * 10);
        if (totalDuration > 60 && (keystrokeCount || 0) < 50) readiness -= 15;
        update.interviewReadinessScore = Math.max(0, Math.round(readiness));

        const analytics = await BehaviorAnalytics.findOneAndUpdate(
            { sessionId },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error("Behavior tracking error:", error.message);
        res.status(500).json({ message: "Failed to track behavior", error: error.message });
    }
};

/**
 * GET /api/behavior/user/:userId
 * Get behavior analytics summary for a user (admin only).
 */
exports.getUserBehavior = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [analytics, total] = await Promise.all([
            BehaviorAnalytics.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("problemId", "title difficulty")
                .lean(),
            BehaviorAnalytics.countDocuments({ userId }),
        ]);

        // Compute aggregated stats
        const aggregated = await BehaviorAnalytics.aggregate([
            { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
            {
                $group: {
                    _id: null,
                    avgTypingSpeed: { $avg: "$typingSpeed" },
                    avgIdleTime: { $avg: "$idleTime" },
                    totalTabSwitches: { $sum: "$tabSwitchCount" },
                    totalCopyPastes: { $sum: "$copyPasteCount" },
                    avgReadinessScore: { $avg: "$interviewReadinessScore" },
                    sessionsCount: { $sum: 1 },
                    highRiskSessions: {
                        $sum: { $cond: [{ $eq: ["$riskLevel", "high"] }, 1, 0] },
                    },
                },
            },
        ]);

        res.json({
            success: true,
            data: analytics,
            summary: aggregated[0] || null,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get behavior error:", error.message);
        res.status(500).json({ message: "Failed to get behavior data", error: error.message });
    }
};

/**
 * GET /api/behavior/readiness
 * Get interview readiness score for the authenticated user.
 */
exports.getReadinessScore = async (req, res) => {
    try {
        const recent = await BehaviorAnalytics.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        if (recent.length === 0) {
            return res.json({
                success: true,
                data: {
                    score: 0,
                    sessionsAnalyzed: 0,
                    message: "No sessions recorded yet. Start coding to build your readiness score!",
                },
            });
        }

        const avgScore = recent.reduce((sum, s) => sum + s.interviewReadinessScore, 0) / recent.length;
        const flags = {};
        recent.forEach(s => {
            s.suspiciousFlags.forEach(f => {
                flags[f] = (flags[f] || 0) + 1;
            });
        });

        res.json({
            success: true,
            data: {
                score: Math.round(avgScore),
                sessionsAnalyzed: recent.length,
                commonIssues: Object.entries(flags)
                    .sort((a, b) => b[1] - a[1])
                    .map(([flag, count]) => ({ flag, count })),
                trend: recent.length >= 2
                    ? recent[0].interviewReadinessScore - recent[recent.length - 1].interviewReadinessScore
                    : 0,
            },
        });
    } catch (error) {
        console.error("Readiness score error:", error.message);
        res.status(500).json({ message: "Failed to get readiness score", error: error.message });
    }
};
