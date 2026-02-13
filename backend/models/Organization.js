/**
 * Organization Model (Multi-Tenant Architecture)
 * ================================================
 * Enables organization/institution-based isolation for:
 *   - College/company-specific coding contests
 *   - Org-scoped leaderboards
 *   - Tenant-separated analytics
 *   - Subscription-based feature gating
 *
 * SCALABILITY NOTE:
 * Multi-tenancy is achieved via organizationId references rather than
 * separate databases, following the "shared database, shared schema"
 * pattern — optimal for < 10K tenants. For enterprise scale, migrate
 * to "shared database, separate schemas" or "separate databases".
 */

const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: ["org_admin", "moderator", "member"],
        default: "member",
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        logo: {
            type: String,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [memberSchema],

        // ── Subscription ──
        subscriptionPlan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "free",
        },
        maxMembers: {
            type: Number,
            default: 50,   // free tier limit
        },

        // ── Settings ──
        settings: {
            allowPublicJoin: { type: Boolean, default: false },
            contestLimit: { type: Number, default: 5 },
            customBranding: { type: Boolean, default: false },
        },

        // ── Metadata ──
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ── Indexes ──
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ "members.user": 1 });
organizationSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model("Organization", organizationSchema);
