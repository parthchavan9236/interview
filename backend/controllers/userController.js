const User = require("../models/User");

// Get leaderboard (top 10 users by solved problems)
const getLeaderboard = async (req, res) => {
    try {
        const users = await User.find()
            .select("name image solvedProblems")
            .lean();

        // Calculate score based on solvedProblems length
        const leaderboard = users
            .map((user) => ({
                _id: user._id,
                name: user.name,
                image: user.image,
                solvedCount: user.solvedProblems ? user.solvedProblems.length : 0,
            }))
            .sort((a, b) => b.solvedCount - a.solvedCount)
            .slice(0, 10);

        res.json(leaderboard);
    } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all users (Admin only)
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { getLeaderboard, getUsers };
