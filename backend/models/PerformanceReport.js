const mongoose = require("mongoose");

const performanceReportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        data: {
            totalSolved: { type: Number, default: 0 },
            totalSubmissions: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 }, // Percentage
            interviewScore: { type: Number, default: 0 },
            interviewsCompleted: { type: Number, default: 0 },
            ranking: { type: Number, default: 0 },
            totalPoints: { type: Number, default: 0 },
            currentStreak: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
            strengthAreas: [String], // Tags the user excels in
            weakAreas: [String], // Tags the user struggles with
            difficultyBreakdown: {
                Easy: { solved: { type: Number, default: 0 }, attempted: { type: Number, default: 0 } },
                Medium: { solved: { type: Number, default: 0 }, attempted: { type: Number, default: 0 } },
                Hard: { solved: { type: Number, default: 0 }, attempted: { type: Number, default: 0 } },
            },
            recentActivity: [
                {
                    date: String,
                    submissions: Number,
                },
            ],
            badgesEarned: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

performanceReportSchema.index({ user: 1, generatedAt: -1 });

module.exports = mongoose.model("PerformanceReport", performanceReportSchema);
