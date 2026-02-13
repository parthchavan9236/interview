const mongoose = require("mongoose");

const contestSubmissionSchema = new mongoose.Schema(
    {
        contest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contest",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        language: {
            type: String,
            enum: ["javascript", "python"],
            default: "javascript",
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "wrong_answer", "error", "time_limit_exceeded", "runtime_error"],
            default: "pending",
        },
        score: {
            type: Number,
            default: 0,
        },
        executionTime: {
            type: Number,
            default: 0, // in ms
        },
        // Time penalty: how many minutes from contest start the submission was made
        timePenalty: {
            type: Number,
            default: 0,
        },
        results: [
            {
                testCase: Number,
                passed: Boolean,
                input: String,
                expectedOutput: String,
                actualOutput: String,
            },
        ],
        antiCheatFlags: [
            {
                timestamp: { type: Date, default: Date.now },
                reason: String,
            },
        ],
    },
    { timestamps: true }
);

// Indexes for ranking queries
contestSubmissionSchema.index({ contest: 1, user: 1, problem: 1 });
contestSubmissionSchema.index({ contest: 1, status: 1 });
contestSubmissionSchema.index({ contest: 1, score: -1, timePenalty: 1 });

module.exports = mongoose.model("ContestSubmission", contestSubmissionSchema);
