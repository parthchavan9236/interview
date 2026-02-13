const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        problems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
            },
        ],
        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        status: {
            type: String,
            enum: ["upcoming", "ongoing", "completed"],
            default: "upcoming",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes for fast lookups
contestSchema.index({ status: 1, startTime: 1 });
contestSchema.index({ "participants.user": 1 });
contestSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Contest", contestSchema);
