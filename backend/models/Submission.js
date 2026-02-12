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
            enum: ["pending", "accepted", "wrong_answer", "error", "time_limit_exceeded"],
            default: "pending",
        },
        results: [testResultSchema],
        errorMessage: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
