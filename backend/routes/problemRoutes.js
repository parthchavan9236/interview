const express = require("express");
const router = express.Router();
const {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
} = require("../controllers/problemController");
const { protectRoute } = require("../middleware/auth");

router.get("/", getProblems);
router.get("/:id", getProblemById);
router.post("/", protectRoute, createProblem);
router.put("/:id", protectRoute, updateProblem);
router.delete("/:id", protectRoute, deleteProblem);

module.exports = router;
