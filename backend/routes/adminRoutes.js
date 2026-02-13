const express = require("express");
const router = express.Router();
const { protectRoute, protectAdmin } = require("../middleware/auth");
const { getAuditLogs, flagSuspiciousActivity, getSystemHealth } = require("../controllers/adminController");

router.get("/audit-logs", protectRoute, protectAdmin, getAuditLogs);
router.post("/flag-suspicious", protectRoute, protectAdmin, flagSuspiciousActivity);
router.get("/system-health", protectRoute, protectAdmin, getSystemHealth);

module.exports = router;
