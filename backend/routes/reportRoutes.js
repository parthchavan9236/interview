const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const { generateReport, getReport, downloadReportData } = require("../controllers/reportController");

router.post("/generate", protectRoute, generateReport);
router.get("/latest", protectRoute, getReport);
router.get("/download", protectRoute, downloadReportData);

module.exports = router;
