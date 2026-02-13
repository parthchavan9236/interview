const Notification = require("../models/Notification");
const PushSubscription = require("../models/PushSubscription");

/**
 * Internal helper: Create and store a notification.
 * Call from any controller when a notable event occurs.
 */
const createNotification = async ({ user, type, title, message, metadata }) => {
    try {
        return await Notification.create({ user, type, title, message, metadata });
    } catch (error) {
        console.error("Notification creation failed:", error.message);
        return null;
    }
};

/**
 * GET /api/notifications
 * Paginated notifications for the authenticated user.
 */
const getUserNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { user: req.user._id };
        if (req.query.unreadOnly === "true") filter.isRead = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: req.user._id, isRead: false }),
        ]);

        res.json({
            notifications,
            unreadCount,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * PUT /api/notifications/read-all
 */
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * POST /api/notifications/push-subscription
 * Save a web push subscription for the authenticated user.
 */
const savePushSubscription = async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: "Invalid push subscription data" });
        }

        // Upsert: update if endpoint exists, create if new
        await PushSubscription.findOneAndUpdate(
            { endpoint },
            { user: req.user._id, endpoint, keys, isActive: true },
            { upsert: true, new: true }
        );

        res.json({ message: "Push subscription saved" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllRead,
    savePushSubscription,
};
