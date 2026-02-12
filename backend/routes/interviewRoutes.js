const express = require("express");
const router = express.Router();
const { createSlot, getOpenSlots, getMySlots, bookSlot } = require("../controllers/interviewController");
const { protectRoute } = require("../middleware/auth");

console.log("Interview routes loaded");

router.get("/test", (req, res) => res.send("Interview routes working"));
router.post("/slots", protectRoute, createSlot);
router.get("/slots", protectRoute, getOpenSlots);
router.get("/my-slots", protectRoute, getMySlots);
router.put("/slots/:id/book", protectRoute, bookSlot);

module.exports = router;
