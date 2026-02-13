const express = require("express");
const router = express.Router();
const { protectRoute, protectAdmin } = require("../middleware/auth");
const {
    getSystemHealth,
    getPerformanceStats,
    getEndpointStats,
} = require("../controllers/metricsController");

router.use(protectRoute);
router.use(protectAdmin);

router.get("/system", getSystemHealth);
router.get("/performance", getPerformanceStats);
router.get("/endpoints", getEndpointStats);

module.exports = router;
