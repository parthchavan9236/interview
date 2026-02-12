const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxLength: 1000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
