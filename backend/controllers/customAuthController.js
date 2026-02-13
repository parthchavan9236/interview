const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "codeinterview_jwt_secret_key_2026";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        // Validate role
        const validRole = ["interviewer", "candidate"].includes(role) ? role : "candidate";

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: validRole,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "Account created successfully",
            token,
            user,
        });
    } catch (error) {
        console.error("Register error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email already in use" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const { updateStreak } = require("./gamificationController");

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email (include password for comparison)
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!user.password) {
            return res.status(401).json({
                message: "This account uses Clerk authentication. Please sign in with Clerk.",
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Update streak
        await updateStreak(user);

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/auth/me (works with protectRoute middleware)
const getProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { register, login, getProfile };
