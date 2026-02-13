const Contest = require("../models/Contest");
const ContestSubmission = require("../models/ContestSubmission");
const Problem = require("../models/Problem");
const { logActivity } = require("../middleware/activityLogger");

/**
 * POST /api/contests
 * Admin only: Create a new contest.
 */
const createContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ message: "Title, startTime, and endTime are required" });
        }

        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({ message: "endTime must be after startTime" });
        }

        const contest = await Contest.create({
            title,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            problems: problems || [],
            createdBy: req.user._id,
            status: new Date(startTime) > new Date() ? "upcoming" : "ongoing",
        });

        await logActivity({
            actionType: "CONTEST_CREATED",
            performedBy: req.user._id,
            targetId: contest._id,
            targetModel: "Contest",
            ipAddress: req.clientInfo?.ipAddress,
            metadata: { title },
        });

        res.status(201).json(contest);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/contests
 * Paginated list with optional status filter.
 */
const getContests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isDeleted: false };
        if (req.query.status) filter.status = req.query.status;

        // Auto-update statuses based on current time
        const now = new Date();
        await Contest.updateMany(
            { status: "upcoming", startTime: { $lte: now }, isDeleted: false },
            { $set: { status: "ongoing" } }
        );
        await Contest.updateMany(
            { status: "ongoing", endTime: { $lte: now }, isDeleted: false },
            { $set: { status: "completed" } }
        );

        const [contests, total] = await Promise.all([
            Contest.find(filter)
                .populate("problems", "title difficulty")
                .populate("createdBy", "name")
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Contest.countDocuments(filter),
        ]);

        // Add participant count to each contest
        const enriched = contests.map((c) => ({
            ...c,
            participantCount: c.participants?.length || 0,
        }));

        res.json({
            contests: enriched,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/contests/:id
 */
const getContestById = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate("problems", "title description difficulty tags")
            .populate("participants.user", "name image")
            .populate("createdBy", "name");

        if (!contest || contest.isDeleted) {
            return res.status(404).json({ message: "Contest not found" });
        }

        res.json(contest);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * POST /api/contests/:id/join
 * User joins a contest. Locked after endTime.
 */
const joinContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);

        if (!contest || contest.isDeleted) {
            return res.status(404).json({ message: "Contest not found" });
        }

        if (contest.status === "completed" || new Date() > contest.endTime) {
            return res.status(400).json({ message: "Contest has ended. Cannot join." });
        }

        // Check if already joined
        const alreadyJoined = contest.participants.some(
            (p) => p.user.toString() === req.user._id.toString()
        );
        if (alreadyJoined) {
            return res.status(400).json({ message: "Already joined this contest" });
        }

        contest.participants.push({ user: req.user._id });
        await contest.save();

        await logActivity({
            actionType: "CONTEST_JOINED",
            performedBy: req.user._id,
            targetId: contest._id,
            targetModel: "Contest",
            ipAddress: req.clientInfo?.ipAddress,
        });

        res.json({ message: "Joined contest successfully", contest });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * POST /api/contests/:id/submit
 * Submit a solution during a contest.
 */
const submitContestSolution = async (req, res) => {
    try {
        const { problemId, code, language } = req.body;
        const contest = await Contest.findById(req.params.id);

        if (!contest || contest.isDeleted) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Auto-lock after endTime
        if (new Date() > contest.endTime) {
            return res.status(400).json({ message: "Contest has ended. Submissions locked." });
        }

        if (contest.status !== "ongoing") {
            return res.status(400).json({ message: "Contest is not currently active" });
        }

        // Verify user is a participant
        const isParticipant = contest.participants.some(
            (p) => p.user.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: "You must join the contest first" });
        }

        // Verify problem is in contest
        if (!contest.problems.map(String).includes(problemId)) {
            return res.status(400).json({ message: "Problem is not part of this contest" });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Problem not found" });

        // Execute code against test cases (reuse Piston logic)
        const results = [];
        let allPassed = true;
        const startTime = Date.now();

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

        const executionTime = Date.now() - startTime;
        const status = allPassed ? "accepted" : "wrong_answer";

        // Score: difficulty-based points for accepted solutions
        const pointsMap = { Easy: 100, Medium: 200, Hard: 300 };
        const score = allPassed ? (pointsMap[problem.difficulty] || 100) : 0;

        // Time penalty: minutes since contest start
        const timePenalty = Math.floor((Date.now() - contest.startTime.getTime()) / (1000 * 60));

        const submission = await ContestSubmission.create({
            contest: contest._id,
            user: req.user._id,
            problem: problemId,
            code,
            language: language || "javascript",
            status,
            score,
            executionTime,
            timePenalty,
            results,
        });

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * GET /api/contests/:id/ranking
 * Aggregation-based ranking: sorted by total score DESC, then total time penalty ASC.
 */
const getContestRanking = async (req, res) => {
    try {
        const contestId = req.params.id;

        const ranking = await ContestSubmission.aggregate([
            {
                $match: {
                    contest: require("mongoose").Types.ObjectId.createFromHexString(contestId),
                    status: "accepted",
                },
            },
            // For each user+problem, keep only the best submission (highest score, lowest time)
            { $sort: { score: -1, timePenalty: 1 } },
            {
                $group: {
                    _id: { user: "$user", problem: "$problem" },
                    bestScore: { $first: "$score" },
                    bestTimePenalty: { $first: "$timePenalty" },
                },
            },
            // Aggregate per user
            {
                $group: {
                    _id: "$_id.user",
                    totalScore: { $sum: "$bestScore" },
                    totalTimePenalty: { $sum: "$bestTimePenalty" },
                    problemsSolved: { $sum: 1 },
                },
            },
            { $sort: { totalScore: -1, totalTimePenalty: 1 } },
            // Lookup user info
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo",
                },
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: "$userInfo.name",
                    image: "$userInfo.image",
                    totalScore: 1,
                    totalTimePenalty: 1,
                    problemsSolved: 1,
                },
            },
        ]);

        // Add rank field
        const rankedResults = ranking.map((r, i) => ({ rank: i + 1, ...r }));

        res.json(rankedResults);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Helper: Execute code via Piston API (shared with submissionController) ──
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
            files: [{ name: `solution.${language === "python" ? "py" : "js"}`, content: code }],
            stdin: input,
        }),
    });

    const data = await response.json();
    if (data.run?.stderr) throw new Error(data.run.stderr);

    return { output: data.run?.stdout || "", stderr: data.run?.stderr || "" };
}

module.exports = {
    createContest,
    getContests,
    getContestById,
    joinContest,
    submitContestSolution,
    getContestRanking,
};
