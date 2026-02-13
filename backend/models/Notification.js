const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "SUBMISSION_RESULT", "BADGE_EARNED", "STREAK_UPDATE",
                "CONTEST_STARTING", "CONTEST_ENDED", "INTERVIEW_REMINDER",
                "PLAGIARISM_FLAG", "SYSTEM_ANNOUNCEMENT", "RANK_CHANGE",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Index for fast user notification queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
