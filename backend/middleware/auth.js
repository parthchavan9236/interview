const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "codeinterview_jwt_secret_key_2026";

// Check if Clerk is properly configured
let clerkClient = null;
try {
    const clerk = require("@clerk/express");
    if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== "your_clerk_secret_key_here") {
        clerkClient = clerk.clerkClient;
    }
} catch (e) {
    // Clerk not available
}

// Middleware to protect routes - supports BOTH custom JWT and Clerk JWT
const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Try custom JWT first
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.userId) {
                const user = await User.findById(decoded.userId);
                if (!user) {
                    return res.status(401).json({ message: "Unauthorized - User not found" });
                }
                req.user = user;
                return next();
            }
        } catch (jwtError) {
            // Not a custom JWT, try Clerk
        }

        // Try Clerk verification
        if (clerkClient) {
            try {
                const { sub: clerkId } = await clerkClient.verifyToken(token);
                const user = await User.findOne({ clerkId });
                if (!user) {
                    return res.status(401).json({ message: "Unauthorized - User not found" });
                }
                req.user = user;
                return next();
            } catch (clerkError) {
                return res.status(401).json({ message: "Unauthorized - Invalid token" });
            }
        }

        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Internal server error" });
        res.status(500).json({ message: "Internal server error" });
    }
};

const protectAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};

module.exports = { protectRoute, protectAdmin };
