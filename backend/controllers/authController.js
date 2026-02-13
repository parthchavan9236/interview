const User = require("../models/User");
const { Webhook } = require("svix");

// Handle Clerk webhook events (user.created, user.updated, user.deleted)
const handleClerkWebhook = async (req, res) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.log("Webhook secret not configured, processing without verification");
        }

        const payload = JSON.stringify(req.body);
        const headers = req.headers;

        let evt;

        if (WEBHOOK_SECRET && WEBHOOK_SECRET !== "whsec_your_webhook_secret_here") {
            const wh = new Webhook(WEBHOOK_SECRET);
            evt = wh.verify(payload, {
                "svix-id": headers["svix-id"],
                "svix-timestamp": headers["svix-timestamp"],
                "svix-signature": headers["svix-signature"],
            });
        } else {
            evt = req.body;
        }

        const eventType = evt.type;
        const data = evt.data;

        if (eventType === "user.created") {
            const user = await User.create({
                clerkId: data.id,
                name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
                email: data.email_addresses[0]?.email_address || "",
                image: data.image_url || "",
                role: "candidate",
            });

            console.log("User created via webhook:", user.email);
        }

        if (eventType === "user.updated") {
            await User.findOneAndUpdate(
                { clerkId: data.id },
                {
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                    email: data.email_addresses[0]?.email_address || "",
                    image: data.image_url || "",
                }
            );
            console.log("User updated via webhook:", data.id);
        }

        if (eventType === "user.deleted") {
            await User.findOneAndDelete({ clerkId: data.id });
            console.log("User deleted via webhook:", data.id);
        }

        res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(400).json({ message: "Webhook error", error: error.message });
    }
};

// Get current user profile
const getMe = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Sync user from Clerk (called from frontend on first login)
const syncUser = async (req, res) => {
    try {
        const { clerkId, name, email, image } = req.body;

        // Try to find user by clerkId
        let user = await User.findOne({ clerkId });

        // If not found by clerkId, try by email to link accounts
        if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
                // Link existing account to Clerk
                user.clerkId = clerkId;
                if (image) user.image = image;
                await user.save();
            }
        }

        if (!user) {
            user = await User.create({
                clerkId,
                name,
                email,
                image: image || "",
                role: "candidate",
            });
        } else {
            // Update existing user
            user.clerkId = clerkId; // Ensure clerkId is set
            user.name = name || user.name;
            user.email = email || user.email;
            user.image = image || user.image;
            await user.save();
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Sync user error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update user role
const updateRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!["interviewer", "candidate"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { role },
            { new: true }
        );

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { handleClerkWebhook, getMe, syncUser, updateRole };
