const express = require("express");
const router = express.Router();
const { getLeaderboard, getUsers } = require("../controllers/userController");
const { protectRoute, protectAdmin } = require("../middleware/auth");

router.get("/leaderboard", protectRoute, getLeaderboard);
router.get("/", protectRoute, protectAdmin, getUsers);

module.exports = router;
