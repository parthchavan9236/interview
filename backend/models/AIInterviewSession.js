/**
 * AI Interview Session Model
 * ===========================
 * Stores conversational AI interview simulations.
 * Provider-agnostic: works with Google Gemini, easily swappable to OpenAI.
 *
 * FLOW:
 * 1. User starts session → AI asks first question based on topic/difficulty
 * 2. User responds → AI evaluates + asks follow-up
 * 3. Session ends → AI generates comprehensive scoring & feedback
 * 4. Full conversation stored for review
 *
 * RESEARCH CONTRIBUTION:
 * Implements a conversational assessment model where AI dynamically
 * adjusts question difficulty based on response quality — a form of
 * Computer Adaptive Testing applied to technical interviews.
 */

const mongoose = require("mongoose");

const conversationTurnSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["ai", "user"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    // Only for AI turns with questions
    questionType: {
        type: String,
        enum: ["initial", "follow_up", "clarification", "hint", "evaluation", null],
        default: null,
    },
}, { _id: false });

const aiInterviewSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ── Session Configuration ──
        topic: {
            type: String,
            required: true,
            trim: true,
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },
        interviewType: {
            type: String,
            enum: ["dsa", "system_design", "behavioral", "frontend", "backend", "general"],
            default: "dsa",
        },
        status: {
            type: String,
            enum: ["active", "completed", "abandoned"],
            default: "active",
        },

        // ── Conversation ──
        conversation: [conversationTurnSchema],
        questionsAsked: {
            type: Number,
            default: 0,
        },
        followUpDepth: {
            type: Number,       // how many follow-ups deep
            default: 0,
        },

        // ── Scoring (filled on session end) ──
        scores: {
            technicalAccuracy: { type: Number, min: 0, max: 100, default: null },
            problemSolving: { type: Number, min: 0, max: 100, default: null },
            communication: { type: Number, min: 0, max: 100, default: null },
            codeQuality: { type: Number, min: 0, max: 100, default: null },
            overall: { type: Number, min: 0, max: 100, default: null },
        },

        // ── Feedback ──
        feedback: {
            summary: { type: String, default: "" },
            strengths: [{ type: String }],
            improvements: [{ type: String }],
            recommendedTopics: [{ type: String }],
        },

        // ── Session Metadata ──
        duration: {
            type: Number,       // in seconds
            default: 0,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },

        // ── AI Provider (for future swap) ──
        aiProvider: {
            type: String,
            enum: ["gemini", "openai", "mock"],
            default: "gemini",
        },
    },
    { timestamps: true }
);

// ── Indexes ──
aiInterviewSessionSchema.index({ userId: 1, createdAt: -1 });
aiInterviewSessionSchema.index({ userId: 1, status: 1 });
aiInterviewSessionSchema.index({ topic: 1, difficulty: 1 });
aiInterviewSessionSchema.index({ "scores.overall": -1 });

module.exports = mongoose.model("AIInterviewSession", aiInterviewSessionSchema);
