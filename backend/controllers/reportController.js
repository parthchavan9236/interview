const mongoose = require("mongoose");
const User = require("../models/User");
const Submission = require("../models/Submission");
const Interview = require("../models/Interview");
const PerformanceReport = require("../models/PerformanceReport");

/**
 * POST /api/reports/generate
 * Compute a full performance report for the authenticated user from DB aggregations.
 */
const generateReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. User profile data
        const user = await User.findById(userId).lean();

        // 2. Total submissions & accuracy
        const submissionStats = await Submission.aggregate([
            { $match: { user: userObjectId, isDeleted: false } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    accepted: {
                        $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
                    },
                },
            },
        ]);

        const totalSubmissions = submissionStats[0]?.total || 0;
        const acceptedSubmissions = submissionStats[0]?.accepted || 0;
        const accuracy = totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0;

        // 3. Difficulty breakdown (solved & attempted per difficulty)
        const difficultyStats = await Submission.aggregate([
            { $match: { user: userObjectId, isDeleted: false } },
            {
                $lookup: {
                    from: "problems",
                    localField: "problem",
                    foreignField: "_id",
                    as: "problemDoc",
                },
            },
            { $unwind: "$problemDoc" },
            {
                $group: {
                    _id: { difficulty: "$problemDoc.difficulty", problem: "$problem" },
                    hasSolved: { $max: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
                },
            },
            {
                $group: {
                    _id: "$_id.difficulty",
                    solved: { $sum: "$hasSolved" },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        const difficultyBreakdown = { Easy: { solved: 0, attempted: 0 }, Medium: { solved: 0, attempted: 0 }, Hard: { solved: 0, attempted: 0 } };
        difficultyStats.forEach((s) => {
            if (difficultyBreakdown[s._id]) {
                difficultyBreakdown[s._id] = { solved: s.solved, attempted: s.attempted };
            }
        });

        // 4. Strength & Weak areas (tags analysis)
        const tagStats = await Submission.aggregate([
            { $match: { user: userObjectId, isDeleted: false } },
            {
                $lookup: {
                    from: "problems",
                    localField: "problem",
                    foreignField: "_id",
                    as: "problemDoc",
                },
            },
            { $unwind: "$problemDoc" },
            { $unwind: "$problemDoc.tags" },
            {
                $group: {
                    _id: "$problemDoc.tags",
                    total: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
                },
            },
            {
                $project: {
                    tag: "$_id",
                    total: 1,
                    accepted: 1,
                    rate: {
                        $cond: [
                            { $gt: ["$total", 0] },
                            { $multiply: [{ $divide: ["$accepted", "$total"] }, 100] },
                            0,
                        ],
                    },
                },
            },
            { $sort: { rate: -1 } },
        ]);

        const strengthAreas = tagStats.filter((t) => t.rate >= 70).map((t) => t.tag).slice(0, 5);
        const weakAreas = tagStats.filter((t) => t.rate < 50).map((t) => t.tag).slice(0, 5);

        // 5. Interview performance
        const interviewStats = await Interview.aggregate([
            {
                $match: {
                    candidate: userObjectId,
                    status: "completed",
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgScore: { $avg: "$score" },
                },
            },
        ]);

        const interviewsCompleted = interviewStats[0]?.count || 0;
        const interviewScore = Math.round(interviewStats[0]?.avgScore || 0);

        // 6. Ranking (position among all users by totalPoints)
        const usersAbove = await User.countDocuments({
            totalPoints: { $gt: user.totalPoints || 0 },
            isDeleted: false,
        });
        const ranking = usersAbove + 1;

        // 7. Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await Submission.aggregate([
            {
                $match: {
                    user: userObjectId,
                    createdAt: { $gte: thirtyDaysAgo },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    submissions: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", submissions: 1 } },
        ]);

        // 8. Build report data
        const totalSolved = (user.solvedProblems || []).length;

        const reportData = {
            totalSolved,
            totalSubmissions,
            accuracy,
            interviewScore,
            interviewsCompleted,
            ranking,
            totalPoints: user.totalPoints || 0,
            currentStreak: user.streak?.currentStreak || 0,
            longestStreak: user.streak?.longestStreak || 0,
            strengthAreas,
            weakAreas,
            difficultyBreakdown,
            recentActivity,
            badgesEarned: (user.badges || []).length,
        };

        // Save report to DB
        const report = await PerformanceReport.create({
            user: userId,
            data: reportData,
        });

        res.status(201).json(report);
    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/reports/latest
 * Get the most recent report for the authenticated user.
 */
const getReport = async (req, res) => {
    try {
        const report = await PerformanceReport.findOne({ user: req.user._id })
            .sort({ generatedAt: -1 })
            .lean();

        if (!report) {
            return res.status(404).json({ message: "No report found. Generate one first." });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/reports/download
 * Return the latest report data as a clean JSON structure ready for PDF conversion.
 */
const downloadReportData = async (req, res) => {
    try {
        const report = await PerformanceReport.findOne({ user: req.user._id })
            .sort({ generatedAt: -1 })
            .populate("user", "name email image")
            .lean();

        if (!report) {
            return res.status(404).json({ message: "No report found. Generate one first." });
        }

        // Structure for PDF conversion
        const pdfData = {
            header: {
                title: "Performance Report",
                generatedAt: report.generatedAt,
                userName: report.user.name,
                userEmail: report.user.email,
                userImage: report.user.image,
            },
            summary: {
                ranking: `#${report.data.ranking}`,
                totalPoints: report.data.totalPoints,
                accuracy: `${report.data.accuracy}%`,
                totalSolved: report.data.totalSolved,
                totalSubmissions: report.data.totalSubmissions,
                currentStreak: report.data.currentStreak,
                longestStreak: report.data.longestStreak,
                badgesEarned: report.data.badgesEarned,
            },
            interviews: {
                completed: report.data.interviewsCompleted,
                averageScore: report.data.interviewScore,
            },
            difficulty: report.data.difficultyBreakdown,
            strengths: report.data.strengthAreas,
            weaknesses: report.data.weakAreas,
            activity: report.data.recentActivity,
        };

        res.json(pdfData);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { generateReport, getReport, downloadReportData };
