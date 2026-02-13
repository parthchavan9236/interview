/**
 * Organization Controller (Multi-Tenant)
 * =======================================
 * CRUD operations for organizations and org-scoped features.
 */

const Organization = require("../models/Organization");
const User = require("../models/User");
const Submission = require("../models/Submission");

/**
 * POST /api/organizations
 * Create a new organization.
 */
exports.createOrganization = async (req, res) => {
    try {
        const { name, slug, description } = req.body;

        // Check slug uniqueness
        const existing = await Organization.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: "Organization slug already exists" });
        }

        const org = await Organization.create({
            name,
            slug,
            description: description || "",
            owner: req.user._id,
            members: [{ user: req.user._id, role: "org_admin" }],
        });

        // Update user's organizationId
        await User.findByIdAndUpdate(req.user._id, { organizationId: org._id });

        res.status(201).json({ success: true, data: org });
    } catch (error) {
        console.error("Create org error:", error.message);
        res.status(500).json({ message: "Failed to create organization", error: error.message });
    }
};

/**
 * GET /api/organizations/:id
 * Get organization details.
 */
exports.getOrganization = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id)
            .populate("owner", "name email image")
            .populate("members.user", "name email image role totalPoints")
            .lean();

        if (!org || org.isDeleted) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.json({ success: true, data: org });
    } catch (error) {
        console.error("Get org error:", error.message);
        res.status(500).json({ message: "Failed to get organization", error: error.message });
    }
};

/**
 * GET /api/organizations
 * List all organizations (paginated).
 */
exports.listOrganizations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [orgs, total] = await Promise.all([
            Organization.find({ isDeleted: false, isActive: true })
                .populate("owner", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Organization.countDocuments({ isDeleted: false, isActive: true }),
        ]);

        res.json({
            success: true,
            data: orgs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("List orgs error:", error.message);
        res.status(500).json({ message: "Failed to list organizations", error: error.message });
    }
};

/**
 * POST /api/organizations/:id/members
 * Add a member to the organization.
 */
exports.addMember = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const org = await Organization.findById(req.params.id);

        if (!org || org.isDeleted) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Check authorization (only org_admin or owner)
        const isOwner = org.owner.equals(req.user._id);
        const isOrgAdmin = org.members.some(m => m.user.equals(req.user._id) && m.role === "org_admin");
        if (!isOwner && !isOrgAdmin && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to add members" });
        }

        // Check member limit
        if (org.members.length >= org.maxMembers) {
            return res.status(400).json({ message: `Member limit reached (${org.maxMembers}). Upgrade plan to add more.` });
        }

        // Check if already a member
        if (org.members.some(m => m.user.toString() === userId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        org.members.push({ user: userId, role: role || "member" });
        await org.save();

        // Update user's organizationId
        await User.findByIdAndUpdate(userId, { organizationId: org._id });

        res.json({ success: true, data: org });
    } catch (error) {
        console.error("Add member error:", error.message);
        res.status(500).json({ message: "Failed to add member", error: error.message });
    }
};

/**
 * DELETE /api/organizations/:id/members/:userId
 * Remove a member from the organization.
 */
exports.removeMember = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org || org.isDeleted) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Can't remove owner
        if (org.owner.toString() === req.params.userId) {
            return res.status(400).json({ message: "Cannot remove the organization owner" });
        }

        org.members = org.members.filter(m => m.user.toString() !== req.params.userId);
        await org.save();

        // Clear user's organizationId
        await User.findByIdAndUpdate(req.params.userId, { organizationId: null });

        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        console.error("Remove member error:", error.message);
        res.status(500).json({ message: "Failed to remove member", error: error.message });
    }
};

/**
 * GET /api/organizations/:id/leaderboard
 * Get organization-scoped leaderboard.
 */
exports.getOrgLeaderboard = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id).lean();
        if (!org || org.isDeleted) {
            return res.status(404).json({ message: "Organization not found" });
        }

        const memberIds = org.members.map(m => m.user);

        const leaderboard = await User.find({
            _id: { $in: memberIds },
            isDeleted: false,
        })
            .select("name email image totalPoints badges streak solvedProblems")
            .sort({ totalPoints: -1 })
            .lean();

        // Add rank
        const ranked = leaderboard.map((user, idx) => ({
            rank: idx + 1,
            ...user,
            problemsSolved: user.solvedProblems?.length || 0,
        }));

        res.json({ success: true, data: ranked });
    } catch (error) {
        console.error("Org leaderboard error:", error.message);
        res.status(500).json({ message: "Failed to get leaderboard", error: error.message });
    }
};

/**
 * GET /api/organizations/:id/analytics
 * Get organization-scoped analytics.
 */
exports.getOrgAnalytics = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id).lean();
        if (!org || org.isDeleted) {
            return res.status(404).json({ message: "Organization not found" });
        }

        const memberIds = org.members.map(m => m.user);

        // Aggregate submission stats for org members
        const [submissionStats, activeMembers] = await Promise.all([
            Submission.aggregate([
                { $match: { user: { $in: memberIds } } },
                {
                    $group: {
                        _id: null,
                        totalSubmissions: { $sum: 1 },
                        accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
                        avgExecutionTime: { $avg: "$executionTime" },
                    },
                },
            ]),
            User.countDocuments({
                _id: { $in: memberIds },
                "streak.lastActiveDate": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);

        const stats = submissionStats[0] || { totalSubmissions: 0, accepted: 0, avgExecutionTime: 0 };

        res.json({
            success: true,
            data: {
                orgName: org.name,
                totalMembers: org.members.length,
                activeMembers,
                subscriptionPlan: org.subscriptionPlan,
                submissions: {
                    total: stats.totalSubmissions,
                    accepted: stats.accepted,
                    accuracy: stats.totalSubmissions > 0
                        ? parseFloat(((stats.accepted / stats.totalSubmissions) * 100).toFixed(1))
                        : 0,
                    avgExecutionTime: parseFloat((stats.avgExecutionTime || 0).toFixed(2)),
                },
            },
        });
    } catch (error) {
        console.error("Org analytics error:", error.message);
        res.status(500).json({ message: "Failed to get analytics", error: error.message });
    }
};
