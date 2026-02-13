const User = require("../models/User");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const cacheService = require("../services/cacheService");

// GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Check cache first (TTL: 5 minutes)
        const cacheKey = "analytics:dashboard";
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const [totalUsers, totalProblems, totalSubmissions, acceptedSubmissions] = await Promise.all([
            User.countDocuments({ isDeleted: false }),
            Problem.countDocuments({ isDeleted: false }),
            Submission.countDocuments({ isDeleted: false }),
            Submission.countDocuments({ status: "accepted", isDeleted: false }),
        ]);

        const successRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2) : 0;

        // Optimized aggregation pipeline: filter soft-deleted submissions
        const mostSolvedProblems = await Submission.aggregate([
            { $match: { status: "accepted", isDeleted: false } },
            { $group: { _id: "$problem", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: "problems", localField: "_id", foreignField: "_id", as: "problem" } },
            { $unwind: "$problem" },
            { $project: { title: "$problem.title", count: 1 } }
        ]);

        const difficultyStats = await Problem.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$difficulty", count: { $sum: 1 } } }
        ]);

        const result = {
            totalUsers,
            totalProblems,
            totalSubmissions,
            successRate,
            mostSolvedProblems,
            difficultyStats
        };

        // Cache the result for 5 minutes
        cacheService.set(cacheKey, result, 300);
        res.json(result);
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/daily-activity
exports.getDailyActivity = async (req, res) => {
    try {
        const cacheKey = "analytics:daily-activity";
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyActivity = await Submission.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: false } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Cache for 2 minutes (more dynamic data)
        cacheService.set(cacheKey, dailyActivity, 120);
        res.json(dailyActivity);
    } catch (error) {
        console.error("Daily activity error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/analytics/leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `analytics:leaderboard:${page}:${limit}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const [topUsers, total] = await Promise.all([
            User.find({ isDeleted: false })
                .sort({ totalPoints: -1 })
                .skip(skip)
                .limit(limit)
                .select("name image totalPoints badges streak"),
            User.countDocuments({ isDeleted: false }),
        ]);

        const result = {
            users: topUsers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };

        // Cache for 3 minutes
        cacheService.set(cacheKey, result, 180);
        res.json(result);
    } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
