const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
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
        interviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        candidateEmail: {
            type: String,
            default: "",
        },
        scheduledAt: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["scheduled", "in_progress", "completed", "cancelled"],
            default: "scheduled",
        },
        streamCallId: {
            type: String,
            required: true,
            unique: true,
        },
        problems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
            },
        ],
        notes: {
            type: String,
            default: "",
        },
        feedback: {
            rating: { type: Number, min: 1, max: 5 },
            comments: { type: String, default: "" },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
