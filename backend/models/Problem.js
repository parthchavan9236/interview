const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
});

const exampleSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: "" },
});

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        examples: [exampleSchema],
        testCases: [testCaseSchema],
        starterCode: {
            javascript: { type: String, default: "function solution(input) {\n  // Write your solution here\n  \n}" },
            python: { type: String, default: "def solution(input):\n    # Write your solution here\n    pass" },
        },
        solution: {
            type: String,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
