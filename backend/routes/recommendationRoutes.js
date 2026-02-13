const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const { validatePagination, handleValidation } = require("../middleware/inputValidator");
const {
    getRecommendations,
    getPerformanceStats,
    recalculate,
} = require("../controllers/recommendationController");

// All routes require authentication
router.use(protectRoute);

router.get("/", validatePagination, handleValidation, getRecommendations);
router.get("/stats", getPerformanceStats);
router.post("/recalculate", recalculate);
router.post("/recalculate/:userId", recalculate); // Admin can recalculate for any user

module.exports = router;
