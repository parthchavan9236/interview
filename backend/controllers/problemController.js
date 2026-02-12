const Problem = require("../models/Problem");

// Create a new problem
const createProblem = async (req, res) => {
    try {
        const { title, description, difficulty, tags, examples, testCases, starterCode, solution } = req.body;

        if (!title || !description || !difficulty) {
            return res.status(400).json({ message: "Title, description, and difficulty are required" });
        }

        const problem = await Problem.create({
            title,
            description,
            difficulty,
            tags: tags || [],
            examples: examples || [],
            testCases: testCases || [],
            starterCode: starterCode || {},
            solution: solution || "",
            createdBy: req.user._id,
        });

        res.status(201).json(problem);
    } catch (error) {
        console.error("Create problem error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all problems
const getProblems = async (req, res) => {
    try {
        const { difficulty, tag, search } = req.query;
        const filter = {};

        if (difficulty) filter.difficulty = difficulty;
        if (tag) filter.tags = { $in: [tag] };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const problems = await Problem.find(filter)
            .select("-testCases -solution")
            .sort({ createdAt: -1 });

        res.status(200).json(problems);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get a single problem by ID
const getProblemById = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id).select("-solution");

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.status(200).json(problem);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update a problem
const updateProblem = async (req, res) => {
    try {
        const problem = await Problem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.status(200).json(problem);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a problem
const deleteProblem = async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.status(200).json({ message: "Problem deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { createProblem, getProblems, getProblemById, updateProblem, deleteProblem };
