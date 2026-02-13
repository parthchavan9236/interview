const express = require("express");
const router = express.Router();
const { getDashboardStats, getDailyActivity, getLeaderboard } = require("../controllers/analyticsController");
const { protectRoute, protectAdmin } = require("../middleware/auth");

// Admin Dashboard stats
router.get("/dashboard", protectRoute, protectAdmin, getDashboardStats);

// Daily activity chart data
router.get("/daily-activity", protectRoute, protectAdmin, getDailyActivity);

// Leaderboard (Public for authenticated users)
router.get("/leaderboard", protectRoute, getLeaderboard);

module.exports = router;
