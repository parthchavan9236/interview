const User = require("../models/User");

// Get leaderboard (top 10 users by totalPoints)
const getLeaderboard = async (req, res) => {
    try {
        const users = await User.find()
            .select("name image totalPoints badges solvedProblems")
            .sort({ totalPoints: -1 })
            .limit(10)
            .lean();

        const leaderboard = users.map((user) => ({
            _id: user._id,
            name: user.name,
            image: user.image,
            totalPoints: user.totalPoints || 0,
            badges: user.badges || [],
            solvedCount: user.solvedProblems ? user.solvedProblems.length : 0,
        }));

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

// Block/Unblock user
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getLeaderboard, getUsers, updateUserStatus };
