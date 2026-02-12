const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

// Execute code against test cases and create submission
const createSubmission = async (req, res) => {
    try {
        const { problemId, code, language } = req.body;

        if (!problemId || !code) {
            return res.status(400).json({ message: "Problem ID and code are required" });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // Execute code against each test case using Piston API
        const results = [];
        let allPassed = true;

        for (let i = 0; i < problem.testCases.length; i++) {
            const tc = problem.testCases[i];
            try {
                const execResult = await executeCode(code, language || "javascript", tc.input);

                const actualOutput = execResult.output.trim();
                const expectedOutput = tc.expectedOutput.trim();
                const passed = actualOutput === expectedOutput;

                if (!passed) allPassed = false;

                results.push({
                    testCase: i + 1,
                    passed,
                    input: tc.input,
                    expectedOutput,
                    actualOutput,
                });
            } catch (execError) {
                allPassed = false;
                results.push({
                    testCase: i + 1,
                    passed: false,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: execError.message || "Execution error",
                });
            }
        }

        const status = allPassed ? "accepted" : "wrong_answer";

        const submission = await Submission.create({
            user: req.user._id,
            problem: problemId,
            code,
            language: language || "javascript",
            status,
            results,
        });

        res.status(201).json(submission);
    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get submissions for a user
const getUserSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.user._id })
            .populate("problem", "title difficulty")
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get submissions for a specific problem by the current user
const getProblemSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            user: req.user._id,
            problem: req.params.problemId,
        }).sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Helper: Execute code via Piston API
async function executeCode(code, language, input) {
    const langMap = {
        javascript: { language: "javascript", version: "18.15.0" },
        python: { language: "python", version: "3.10.0" },
    };

    const langConfig = langMap[language] || langMap.javascript;

    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            language: langConfig.language,
            version: langConfig.version,
            files: [
                {
                    name: `solution.${language === "python" ? "py" : "js"}`,
                    content: code,
                },
            ],
            stdin: input,
        }),
    });

    const data = await response.json();

    if (data.run?.stderr) {
        throw new Error(data.run.stderr);
    }

    return {
        output: data.run?.stdout || "",
        stderr: data.run?.stderr || "",
    };
}

// Get submission stats (solved count, activity)
const getSubmissionStats = async (req, res) => {
    try {
        const userId = req.user._id;
        // Ensure userId is ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Solved problems by difficulty
        // We only want unique accepted problems
        const solvedStats = await Submission.aggregate([
            {
                $match: {
                    user: userObjectId, // Match 'user' field in Submission model
                    status: "accepted" // Lowercase 'accepted' based on createSubmission logic
                }
            },
            { $group: { _id: "$problem" } }, // Group by problem (which is ObjectId)
            {
                $lookup: {
                    from: "problems",
                    localField: "_id",
                    foreignField: "_id",
                    as: "problemDoc"
                }
            },
            { $unwind: "$problemDoc" },
            {
                $group: {
                    _id: "$problemDoc.difficulty",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Transform to cleaner object
        const solved = {
            Easy: 0,
            Medium: 0,
            Hard: 0
        };
        solvedStats.forEach(stat => {
            if (solved[stat._id] !== undefined) {
                solved[stat._id] = stat.count;
            }
        });

        // 2. Activity (Submissions per day)
        const activity = await Submission.aggregate([
            {
                $match: {
                    user: userObjectId
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Total Submissions
        const totalSubmissions = await Submission.countDocuments({ user: userObjectId });

        res.json({ solved, activity, totalSubmissions });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { createSubmission, getUserSubmissions, getProblemSubmissions, getSubmissionStats };
