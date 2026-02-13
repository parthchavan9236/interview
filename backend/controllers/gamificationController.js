const User = require("../models/User");

// Helper to check and award badges
exports.checkBadges = async (user) => {
    const badges = [];
    const solvedCount = user.solvedProblems.length;

    if (solvedCount >= 10 && !user.badges.some(b => b.name === "Problem Solver")) {
        badges.push({ name: "Problem Solver", description: "Solved 10 problems", icon: "🥉" });
    }
    if (solvedCount >= 50 && !user.badges.some(b => b.name === "Code Master")) {
        badges.push({ name: "Code Master", description: "Solved 50 problems", icon: "🥈" });
    }
    if (user.streak.currentStreak >= 7 && !user.badges.some(b => b.name === "Dedicated")) {
        badges.push({ name: "Dedicated", description: "7 Day Streak", icon: "🔥" });
    }

    if (badges.length > 0) {
        user.badges.push(...badges);
        await user.save();
    }
    return badges;
};

// Helper to update streak
exports.updateStreak = async (user) => {
    const today = new Date();
    const lastActive = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;

    if (!lastActive) {
        user.streak.currentStreak = 1;
    } else {
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            user.streak.currentStreak += 1;
        } else if (diffDays > 1) {
            user.streak.currentStreak = 1;
        }
    }

    if (user.streak.currentStreak > user.streak.longestStreak) {
        user.streak.longestStreak = user.streak.currentStreak;
    }

    user.streak.lastActiveDate = today;
    await user.save();
};
