const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actionType: {
            type: String,
            enum: [
                "USER_LOGIN", "USER_REGISTER", "USER_BLOCKED", "USER_UNBLOCKED",
                "PROBLEM_CREATED", "PROBLEM_UPDATED", "PROBLEM_DELETED",
                "SUBMISSION_CREATED", "SUBMISSION_FLAGGED",
                "INTERVIEW_STARTED", "INTERVIEW_ENDED",
                "CONTEST_CREATED", "CONTEST_JOINED",
                "ADMIN_ACTION", "SUSPICIOUS_ACTIVITY",
                "ROLE_CHANGED", "REPORT_GENERATED"
            ],
            required: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        targetModel: {
            type: String,
            enum: ["User", "Problem", "Submission", "Interview", "Contest", null],
            default: null,
        },
        ipAddress: {
            type: String,
            default: "",
        },
        deviceInfo: {
            type: String,
            default: "",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Index for fast querying by user and time
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
