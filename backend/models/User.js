const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            unique: true,
            sparse: true, // Allow null for custom auth users
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            // Only required for custom auth users (not Clerk users)
        },
        image: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["interviewer", "candidate", "admin"],
            default: "candidate",
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        totalPoints: {
            type: Number,
            default: 0
        },
        badges: [
            {
                name: String,
                dateEarned: { type: Date, default: Date.now },
                icon: String,
                description: String
            }
        ],
        streak: {
            currentStreak: { type: Number, default: 0 },
            longestStreak: { type: Number, default: 0 },
            lastActiveDate: {
                type: Date, default: null
            }
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        isFlagged: {
            type: Boolean,
            default: false
        },
        solvedProblems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
            },
        ],
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Performance indexes
userSchema.index({ email: 1 });
userSchema.index({ totalPoints: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("User", userSchema);
