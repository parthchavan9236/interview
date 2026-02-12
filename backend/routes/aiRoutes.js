const express = require("express");
const router = express.Router();
const { getAIHint, analyzeCode } = require("../controllers/aiController");
const { protectRoute } = require("../middleware/auth");

router.post("/hint", protectRoute, getAIHint);
router.post("/analyze", protectRoute, analyzeCode);

module.exports = router;
