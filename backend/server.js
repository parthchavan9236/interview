const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { serve } = require("inngest/express");

// Load environment variables
dotenv.config();

const connectDB = require("./config/db");
const config = require("./config/environments");
const logger = require("./services/logger");
const { extractClientInfo } = require("./middleware/activityLogger");
const responseTimeMiddleware = require("./middleware/responseTimeMiddleware");
const systemMetricsService = require("./services/systemMetricsService");
const configService = require("./services/configService");
const inngest = require("./inngest/client");
const { sendInterviewReminder, processSubmission } = require("./inngest/functions");

// Import routes
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const codeRoutes = require("./routes/codeRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contestRoutes = require("./routes/contestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const behaviorRoutes = require("./routes/behaviorRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const aiInterviewRoutes = require("./routes/aiInterviewRoutes");

const app = express();
const PORT = config.port || 5000;

// ── Security Middleware ──
app.use(helmet());
app.use(
    cors({
        origin: config.corsOrigins?.length > 0
            ? config.corsOrigins
            : ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
    })
);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimitWindow || 15 * 60 * 1000,
    max: config.rateLimitMax || 100,
    message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// ── Activity Logging Middleware ──
app.use(extractClientInfo);

// ── Response Time Tracking (System Metrics) ──
app.use(responseTimeMiddleware);

// Request logger (Winston)
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.clientInfo?.ipAddress,
        userAgent: req.clientInfo?.deviceInfo?.substring(0, 80),
    });
    next();
});

// ── API Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/behavior", behaviorRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/ai-interview", aiInterviewRoutes);

// Inngest route for background jobs
app.use(
    "/api/inngest",
    serve({
        client: inngest,
        functions: [sendInterviewReminder, processSubmission],
    })
);

// ── Health Check (Enhanced) ──
app.get("/api/health", (req, res) => {
    const mongoose = require("mongoose");
    const cacheService = require("./services/cacheService");
    const memUsage = process.memoryUsage();

    res.json({
        status: mongoose.connection.readyState === 1 ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        database: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState],
        memory: {
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
            heap: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
        },
        cache: cacheService.getStats(),
        environment: process.env.NODE_ENV || "development",
    });
});

// 404 Catch-all
app.use((req, res) => {
    logger.warn(`[404] Route not found: ${req.url}`);
    res.status(404).json({ message: "Route not found (Backend)" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// Seed sample problems (for demo)
const Problem = require("./models/Problem");

async function seedProblems() {
    try {
        const count = await Problem.countDocuments();
        if (count === 0) {
            await Problem.insertMany([
                {
                    title: "Two Sum",
                    description:
                        "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer as a JSON array of two indices.",
                    difficulty: "Easy",
                    tags: ["Array", "Hash Table"],
                    examples: [
                        {
                            input: "nums = [2,7,11,15], target = 9",
                            output: "[0,1]",
                            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
                        },
                        {
                            input: "nums = [3,2,4], target = 6",
                            output: "[1,2]",
                            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
                        },
                    ],
                    testCases: [
                        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
                        { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
                        { input: "[3,3]\n6", expectedOutput: "[0,1]" },
                    ],
                    starterCode: {
                        javascript:
                            'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", (l) => lines.push(l));\nrl.on("close", () => {\n  const nums = JSON.parse(lines[0]);\n  const target = parseInt(lines[1]);\n  // Write your solution here\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map[complement] !== undefined) {\n      console.log(JSON.stringify([map[complement], i]));\n      return;\n    }\n    map[nums[i]] = i;\n  }\n});',
                        python:
                            "import json, sys\nlines = sys.stdin.read().strip().split('\\n')\nnums = json.loads(lines[0])\ntarget = int(lines[1])\n# Write your solution here\n",
                    },
                },
                {
                    title: "Reverse String",
                    description:
                        'Write a function that reverses a string. The input string is given as a single line.\n\nPrint the reversed string.',
                    difficulty: "Easy",
                    tags: ["String"],
                    examples: [
                        { input: "hello", output: "olleh", explanation: 'Reversed "hello" is "olleh"' },
                        { input: "world", output: "dlrow", explanation: "" },
                    ],
                    testCases: [
                        { input: "hello", expectedOutput: "olleh" },
                        { input: "world", expectedOutput: "dlrow" },
                        { input: "OpenAI", expectedOutput: "IAnepO" },
                    ],
                    starterCode: {
                        javascript:
                            'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  // Write your solution here\n  console.log(line.split("").reverse().join(""));\n});',
                        python:
                            "s = input()\n# Write your solution here\nprint(s[::-1])",
                    },
                },
                {
                    title: "FizzBuzz",
                    description:
                        'Given an integer `n`, print each number from 1 to n on a new line. But for multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for multiples of both 3 and 5 print "FizzBuzz".',
                    difficulty: "Easy",
                    tags: ["Math", "String"],
                    examples: [
                        {
                            input: "5",
                            output: "1\n2\nFizz\n4\nBuzz",
                            explanation: "",
                        },
                    ],
                    testCases: [
                        { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz" },
                        { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
                    ],
                    starterCode: {
                        javascript:
                            'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  const n = parseInt(line);\n  // Write your solution here\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) console.log("FizzBuzz");\n    else if (i % 3 === 0) console.log("Fizz");\n    else if (i % 5 === 0) console.log("Buzz");\n    else console.log(i);\n  }\n});',
                        python:
                            'n = int(input())\n# Write your solution here\nfor i in range(1, n+1):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
                    },
                },
                {
                    title: "Palindrome Check",
                    description:
                        "Given a string, determine if it is a palindrome considering only alphanumeric characters and ignoring cases.\n\nPrint `true` if it is a palindrome, `false` otherwise.",
                    difficulty: "Easy",
                    tags: ["String", "Two Pointers"],
                    examples: [
                        {
                            input: "A man, a plan, a canal: Panama",
                            output: "true",
                            explanation: '"amanaplanacanalpanama" is a palindrome.',
                        },
                        { input: "race a car", output: "false", explanation: "" },
                    ],
                    testCases: [
                        { input: "A man, a plan, a canal: Panama", expectedOutput: "true" },
                        { input: "race a car", expectedOutput: "false" },
                        { input: " ", expectedOutput: "true" },
                    ],
                    starterCode: {
                        javascript:
                            'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  // Write your solution here\n  const cleaned = line.toLowerCase().replace(/[^a-z0-9]/g, "");\n  console.log(cleaned === cleaned.split("").reverse().join(""));\n});',
                        python:
                            "import re\ns = input()\n# Write your solution here\ncleaned = re.sub(r'[^a-z0-9]', '', s.lower())\nprint('true' if cleaned == cleaned[::-1] else 'false')",
                    },
                },
                {
                    title: "Maximum Subarray",
                    description:
                        "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nInput: first line is a JSON array of integers.\nOutput: print the maximum subarray sum.",
                    difficulty: "Medium",
                    tags: ["Array", "Dynamic Programming"],
                    examples: [
                        {
                            input: "[-2,1,-3,4,-1,2,1,-5,4]",
                            output: "6",
                            explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
                        },
                    ],
                    testCases: [
                        { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
                        { input: "[1]", expectedOutput: "1" },
                        { input: "[5,4,-1,7,8]", expectedOutput: "23" },
                    ],
                    starterCode: {
                        javascript:
                            'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  const nums = JSON.parse(line);\n  // Write your solution here (Kadane\'s Algorithm)\n  let maxSum = nums[0], currentSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  console.log(maxSum);\n});',
                        python:
                            "import json\nnums = json.loads(input())\n# Write your solution here\n",
                    },
                },
            ]);
            logger.info("Sample problems seeded successfully");
        }
    } catch (error) {
        logger.error("Seed error:", { error: error.message });
    }
}

// ── Start Server ──
connectDB()
    .then(async () => {
        // Validate config on startup
        try { configService.validate(); } catch (e) { logger.warn("Config validation:", e.message); }

        seedProblems();

        // Start system metrics collection
        systemMetricsService.start();

        // Ensure all model collections exist in MongoDB
        // (Collections are lazy-created by default — this forces their creation)
        try {
            const models = [
                require("./models/User"),
                require("./models/Problem"),
                require("./models/Submission"),
                require("./models/Interview"),
                require("./models/InterviewSlot"),
                require("./models/Comment"),
                require("./models/AuditLog"),
                require("./models/Contest"),
                require("./models/ContestSubmission"),
                require("./models/Notification"),
                require("./models/PerformanceReport"),
                require("./models/PlagiarismReport"),
                require("./models/PushSubscription"),
                require("./models/UserPerformanceMetrics"),
                require("./models/BehaviorAnalytics"),
                require("./models/SystemMetrics"),
                require("./models/Organization"),
                require("./models/AIInterviewSession"),
            ];
            for (const Model of models) {
                await Model.createCollection();
            }
            logger.info(`Initialized ${models.length} database collections.`);
        } catch (err) {
            logger.warn("Collection init warning (non-fatal):", err.message);
        }

        // Create HTTP server for Socket.io
        const http = require("http");
        const { initSocket } = require("./socket/socket");
        const server = http.createServer(app);

        initSocket(server);

        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
        });

        // ── Graceful Shutdown ──
        const gracefulShutdown = (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);
            // Flush metrics before shutdown
            systemMetricsService.stop().catch(() => { });
            server.close(() => {
                logger.info("HTTP server closed.");
                const mongoose = require("mongoose");
                mongoose.connection.close(false).then(() => {
                    logger.info("MongoDB connection closed.");
                    process.exit(0);
                });
            });

            // Force shutdown after 10s if graceful fails
            setTimeout(() => {
                logger.error("Forced shutdown after timeout.");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    })
    .catch((err) => {
        logger.error("Failed to start server:", { error: err.message });
    });

module.exports = app;
