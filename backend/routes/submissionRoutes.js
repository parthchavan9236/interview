const express = require("express");
const router = express.Router();
const {
    createSubmission,
    getUserSubmissions,
    getProblemSubmissions,
    getSubmissionStats,
} = require("../controllers/submissionController");
const { protectRoute } = require("../middleware/auth");

router.get("/stats", protectRoute, getSubmissionStats); // Must be before dynamic routes if any collision
router.post("/", protectRoute, createSubmission);
router.get("/", protectRoute, getUserSubmissions);
router.get("/problem/:problemId", protectRoute, getProblemSubmissions);

module.exports = router;
