const express = require("express");
const router = express.Router();
const { protectRoute, protectAdmin } = require("../middleware/auth");
const {
    createContest,
    getContests,
    getContestById,
    joinContest,
    submitContestSolution,
    getContestRanking,
} = require("../controllers/contestController");

// Admin: Create contest
router.post("/", protectRoute, protectAdmin, createContest);

// Public: List contests (paginated)
router.get("/", protectRoute, getContests);

// Public: Get contest detail
router.get("/:id", protectRoute, getContestById);

// User: Join contest
router.post("/:id/join", protectRoute, joinContest);

// User: Submit solution
router.post("/:id/submit", protectRoute, submitContestSolution);

// Public: Get ranking
router.get("/:id/ranking", protectRoute, getContestRanking);

module.exports = router;
