const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
    testCase: { type: Number },
    passed: { type: Boolean },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
});

const submissionSchema = new mongoose.Schema(
    {
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
            enum: ["pending", "accepted", "wrong_answer", "error", "time_limit_exceeded", "runtime_error", "compilation_error"],
            default: "pending",
        },
        executionTime: { type: Number, default: 0 }, // in ms
        memoryUsage: { type: Number, default: 0 }, // in KB
        results: [testResultSchema],
        errorMessage: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "",
        },
        deviceInfo: {
            type: String,
            default: "",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isFlagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Performance indexes for fast queries
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ isFlagged: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
