const Comment = require("../models/Comment");

// Add a comment to a problem
const addComment = async (req, res) => {
    try {
        const { problemId, content } = req.body;

        if (!problemId || !content) {
            return res.status(400).json({ message: "Problem ID and content are required" });
        }

        const comment = await Comment.create({
            user: req.user._id,
            problem: problemId,
            content,
        });

        // Populate user details for immediate display
        await comment.populate("user", "name image role");

        res.status(201).json(comment);
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get comments for a problem
const getComments = async (req, res) => {
    try {
        const { problemId } = req.params;

        const comments = await Comment.find({ problem: problemId })
            .populate("user", "name image role")
            .sort({ createdAt: -1 }); // Newest first

        res.json(comments);
    } catch (error) {
        console.error("Get comments error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { addComment, getComments };
