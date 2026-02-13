const express = require("express");
const router = express.Router();
const { getAIHint, analyzeCode, chatWithAI } = require("../controllers/aiController");
const { protectRoute } = require("../middleware/auth");

router.post("/hint", protectRoute, getAIHint);
router.post("/analyze", protectRoute, analyzeCode);
router.post("/analyze", protectRoute, analyzeCode);
router.post("/chat", protectRoute, chatWithAI);
router.post("/interview-feedback", protectRoute, require("../controllers/aiController").generateInterviewFeedback);

module.exports = router;
