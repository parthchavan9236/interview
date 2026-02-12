const express = require("express");
const router = express.Router();
const { handleClerkWebhook, getMe, syncUser, updateRole } = require("../controllers/authController");
const { register, login, getProfile } = require("../controllers/customAuthController");
const { protectRoute } = require("../middleware/auth");

// Custom auth routes (no auth needed)
router.post("/register", register);
router.post("/login", login);

// Clerk webhook (no auth needed)
router.post("/webhook", handleClerkWebhook);

// Sync user from frontend
router.post("/sync", syncUser);

// Protected routes
router.get("/me", protectRoute, getProfile);
router.put("/role", protectRoute, updateRole);

module.exports = router;
