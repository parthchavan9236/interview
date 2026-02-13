const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const {
    getUserNotifications,
    markAsRead,
    markAllRead,
    savePushSubscription,
} = require("../controllers/notificationController");

router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, markAsRead);
router.put("/read-all", protectRoute, markAllRead);
router.post("/push-subscription", protectRoute, savePushSubscription);

module.exports = router;
