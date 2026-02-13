const mongoose = require("mongoose");

const plagiarismReportSchema = new mongoose.Schema(
    {
        submission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Submission",
            required: true,
        },
        comparedWith: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Submission",
            required: true,
        },
        similarityPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        isFlagged: {
            type: Boolean,
            default: false, // Flagged when similarity > threshold (e.g., 80%)
        },
        algorithm: {
            type: String,
            default: "ngram-jaccard", // Algorithm used for comparison
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

plagiarismReportSchema.index({ submission: 1 });
plagiarismReportSchema.index({ isFlagged: 1, similarityPercentage: -1 });

module.exports = mongoose.model("PlagiarismReport", plagiarismReportSchema);
