const Interview = require("../models/Interview");
const User = require("../models/User");
const { StreamClient } = require("@stream-io/node-sdk");
const { v4: uuidv4 } = require("crypto");

// Helper to generate a unique call ID
function generateCallId() {
    return `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Create a new interview
const createInterview = async (req, res) => {
    try {
        const { title, description, candidateEmail, scheduledAt, problems } = req.body;

        if (!title || !scheduledAt) {
            return res.status(400).json({ message: "Title and scheduled date are required" });
        }

        // Find candidate by email if provided
        let candidate = null;
        if (candidateEmail) {
            candidate = await User.findOne({ email: candidateEmail });
        }

        const streamCallId = generateCallId();

        const interview = await Interview.create({
            title,
            description: description || "",
            interviewer: req.user._id,
            candidate: candidate?._id || null,
            candidateEmail: candidateEmail || "",
            scheduledAt,
            streamCallId,
            problems: problems || [],
        });

        const populatedInterview = await Interview.findById(interview._id)
            .populate("interviewer", "name email image")
            .populate("candidate", "name email image")
            .populate("problems", "title difficulty");

        res.status(201).json(populatedInterview);
    } catch (error) {
        console.error("Create interview error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all interviews for the current user
const getInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({
            $or: [
                { interviewer: req.user._id },
                { candidate: req.user._id },
                { candidateEmail: req.user.email },
            ],
        })
            .populate("interviewer", "name email image")
            .populate("candidate", "name email image")
            .populate("problems", "title difficulty")
            .sort({ scheduledAt: -1 });

        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get a single interview
const getInterviewById = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate("interviewer", "name email image")
            .populate("candidate", "name email image")
            .populate("problems", "title difficulty");

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update interview
const updateInterview = async (req, res) => {
    try {
        const interview = await Interview.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )
            .populate("interviewer", "name email image")
            .populate("candidate", "name email image");

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete interview
const deleteInterview = async (req, res) => {
    try {
        const interview = await Interview.findByIdAndDelete(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json({ message: "Interview deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Generate Stream token for video call
const getStreamToken = async (req, res) => {
    try {
        const apiKey = process.env.STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;

        if (!apiKey || !apiSecret || apiKey === "your_stream_api_key") {
            return res.status(200).json({
                token: "demo_token",
                apiKey: "demo_key",
                message: "Stream not configured - using demo mode",
            });
        }

        const client = new StreamClient(apiKey, apiSecret);

        const token = client.generateUserToken({
            user_id: req.user.clerkId,
        });

        res.status(200).json({ token, apiKey });
    } catch (error) {
        console.error("Stream token error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
    getStreamToken,
};
