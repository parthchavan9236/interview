const express = require("express");
const router = express.Router();
const { createSlot, getOpenSlots, getMySlots, bookSlot, startInterview, endInterview, getInterview } = require("../controllers/interviewController");
const { protectRoute } = require("../middleware/auth");

console.log("Interview routes loaded");

router.get("/test", (req, res) => res.send("Interview routes working"));
router.post("/slots", protectRoute, createSlot);
router.get("/slots", protectRoute, getOpenSlots);
router.get("/my-slots", protectRoute, getMySlots);
router.put("/slots/:id/book", protectRoute, bookSlot);
router.get("/:id", protectRoute, getInterview);
router.post("/:id/start", protectRoute, startInterview);
router.post("/:id/end", protectRoute, endInterview);
router.post("/:id/problems", protectRoute, require("../controllers/interviewController").addProblemToInterview);

module.exports = router;
