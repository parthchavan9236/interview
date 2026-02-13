const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const { validateAIInterview, handleValidation, validatePagination } = require("../middleware/inputValidator");
const {
    startSession,
    sendMessage,
    endSession,
    getHistory,
    getSession,
} = require("../controllers/aiInterviewController");

router.use(protectRoute);

router.post("/start", validateAIInterview, handleValidation, startSession);
router.post("/:id/message", sendMessage);
router.post("/:id/end", endSession);
router.get("/history", validatePagination, handleValidation, getHistory);
router.get("/:id", getSession);

module.exports = router;
