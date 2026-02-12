const express = require("express");
const router = express.Router();
const {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
    getStreamToken,
} = require("../controllers/interviewController");
const { protectRoute } = require("../middleware/auth");

router.get("/stream-token", protectRoute, getStreamToken);
router.post("/", protectRoute, createInterview);
router.get("/", protectRoute, getInterviews);
router.get("/:id", protectRoute, getInterviewById);
router.put("/:id", protectRoute, updateInterview);
router.delete("/:id", protectRoute, deleteInterview);

module.exports = router;
