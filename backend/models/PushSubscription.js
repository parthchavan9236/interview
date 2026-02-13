const mongoose = require("mongoose");

/**
 * PushSubscription Model
 * ----------------------
 * Stores web push notification subscription data per user.
 * Structure follows the Web Push API standard.
 * Ready for integration with the `web-push` npm package.
 */
const pushSubscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        endpoint: {
            type: String,
            required: true,
        },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

pushSubscriptionSchema.index({ user: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
