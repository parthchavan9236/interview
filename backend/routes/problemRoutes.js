const express = require("express");
const router = express.Router();
const {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
} = require("../controllers/problemController");
const { protectRoute, protectAdmin } = require("../middleware/auth");

router.get("/", getProblems);
router.get("/:id", getProblemById);
router.post("/", protectRoute, protectAdmin, createProblem);
router.put("/:id", protectRoute, protectAdmin, updateProblem);
router.delete("/:id", protectRoute, protectAdmin, deleteProblem);

module.exports = router;
