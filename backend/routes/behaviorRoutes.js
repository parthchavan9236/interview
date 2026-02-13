const express = require("express");
const router = express.Router();
const { protectRoute, protectAdmin } = require("../middleware/auth");
const { validateBehaviorTrack, handleValidation } = require("../middleware/inputValidator");
const {
    trackBehavior,
    getUserBehavior,
    getReadinessScore,
} = require("../controllers/behaviorController");

router.use(protectRoute);

router.post("/track", validateBehaviorTrack, handleValidation, trackBehavior);
router.get("/readiness", getReadinessScore);
router.get("/user/:userId", protectAdmin, getUserBehavior);

module.exports = router;
