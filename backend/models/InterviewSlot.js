const mongoose = require("mongoose");

const interviewSlotSchema = new mongoose.Schema(
    {
        interviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        startTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["open", "booked", "completed"],
            default: "open",
        },
        meetingLink: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("InterviewSlot", interviewSlotSchema);
