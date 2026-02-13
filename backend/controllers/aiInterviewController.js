/**
 * AI Interview Controller (WOW Feature)
 * ======================================
 * Conversational AI interview simulation.
 * Uses Gemini API with graceful mock fallback.
 *
 * FLOW:
 * 1. POST /start → AI asks initial question → session created
 * 2. POST /:id/message → User responds → AI evaluates + follow-up
 * 3. POST /:id/end → Session ends → AI generates scores + feedback
 */

const AIInterviewSession = require("../models/AIInterviewSession");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");

// ── Interview System Prompts ──
const INTERVIEW_SYSTEM_PROMPT = `You are an expert technical interviewer at a top tech company (like Google, Meta, or Amazon).

RULES:
1. Ask ONE clear technical question at a time
2. Wait for the candidate's response before asking follow-ups  
3. Ask follow-up questions to probe deeper understanding
4. Be encouraging but honest about mistakes
5. Adjust difficulty based on responses
6. Use markdown formatting for code and explanations

INTERVIEW STYLE:
- Start with a warm introduction
- Ask the main question clearly
- After each response, provide brief feedback and a follow-up
- Keep track of what's been covered
- Be conversational and professional`;

const SCORING_PROMPT = `Based on the conversation below, evaluate the candidate and return a JSON object with this exact structure (no markdown, no code block, just raw JSON):
{
    "technicalAccuracy": <0-100>,
    "problemSolving": <0-100>,
    "communication": <0-100>,
    "codeQuality": <0-100>,
    "overall": <0-100>,
    "summary": "<2-3 sentence summary>",
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "recommendedTopics": ["topic1", "topic2"]
}`;

/**
 * POST /api/ai-interview/start
 * Start a new AI interview session.
 */
exports.startSession = async (req, res) => {
    try {
        const { topic, difficulty, interviewType } = req.body;

        // Check for existing active session
        const activeSession = await AIInterviewSession.findOne({
            userId: req.user._id,
            status: "active",
        });
        if (activeSession) {
            return res.status(400).json({
                message: "You already have an active interview session",
                sessionId: activeSession._id,
            });
        }

        // Generate first question
        const questionPrompt = `${INTERVIEW_SYSTEM_PROMPT}

You are conducting a ${difficulty || "Medium"} level ${interviewType || "dsa"} interview on the topic: "${topic}".

Start the interview:
1. Briefly introduce yourself
2. Ask the FIRST technical question on this topic
3. Make it appropriate for ${difficulty || "Medium"} difficulty

Keep your response under 200 words.`;

        let aiContent;
        try {
            if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
                throw new Error("No API key");
            }
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(questionPrompt);
            aiContent = result.response.text();
        } catch {
            // Smart mock fallback
            aiContent = getMockQuestion(topic, difficulty, interviewType);
        }

        const session = await AIInterviewSession.create({
            userId: req.user._id,
            topic,
            difficulty: difficulty || "Medium",
            interviewType: interviewType || "dsa",
            status: "active",
            conversation: [
                { role: "ai", content: aiContent, questionType: "initial" },
            ],
            questionsAsked: 1,
            aiProvider: process.env.GEMINI_API_KEY ? "gemini" : "mock",
            startedAt: new Date(),
        });

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        console.error("Start interview error:", error.message);
        res.status(500).json({ message: "Failed to start interview", error: error.message });
    }
};

/**
 * POST /api/ai-interview/:id/message
 * Send a response and get AI follow-up.
 */
exports.sendMessage = async (req, res) => {
    try {
        const session = await AIInterviewSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
            status: "active",
        });

        if (!session) {
            return res.status(404).json({ message: "Active session not found" });
        }

        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Add user message
        session.conversation.push({ role: "user", content: message.trim() });

        // Generate AI follow-up
        const conversationText = session.conversation
            .map(t => `${t.role === "ai" ? "Interviewer" : "Candidate"}: ${t.content}`)
            .join("\n\n");

        const followUpPrompt = `${INTERVIEW_SYSTEM_PROMPT}

This is a ${session.difficulty} ${session.interviewType} interview on "${session.topic}".

Conversation so far:
${conversationText}

As the interviewer, provide:
1. Brief feedback on the candidate's last response (what was good, what could be better)
2. A follow-up question OR a new related question to probe deeper

${session.questionsAsked >= 5 ? "This is the final question. Make it count." : ""}
Keep response under 200 words.`;

        let aiResponse;
        try {
            if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
                throw new Error("No API key");
            }
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(followUpPrompt);
            aiResponse = result.response.text();
        } catch {
            aiResponse = getMockFollowUp(session.topic, session.questionsAsked);
        }

        session.conversation.push({
            role: "ai",
            content: aiResponse,
            questionType: session.questionsAsked >= 5 ? "evaluation" : "follow_up",
        });
        session.questionsAsked += 1;
        session.followUpDepth += 1;

        await session.save();

        res.json({
            success: true,
            data: {
                message: aiResponse,
                questionsAsked: session.questionsAsked,
                isLastQuestion: session.questionsAsked >= 6,
            },
        });
    } catch (error) {
        console.error("Send message error:", error.message);
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
};

/**
 * POST /api/ai-interview/:id/end
 * End session and generate scores/feedback.
 */
exports.endSession = async (req, res) => {
    try {
        const session = await AIInterviewSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
            status: "active",
        });

        if (!session) {
            return res.status(404).json({ message: "Active session not found" });
        }

        // Calculate duration
        session.endedAt = new Date();
        session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
        session.status = "completed";

        // Generate scoring
        const conversationText = session.conversation
            .map(t => `${t.role === "ai" ? "Interviewer" : "Candidate"}: ${t.content}`)
            .join("\n\n");

        let scores;
        try {
            if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
                throw new Error("No API key");
            }
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(
                `${SCORING_PROMPT}\n\nConversation:\n${conversationText}`
            );
            const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
            scores = JSON.parse(text);
        } catch {
            // Mock scoring based on conversation length and quality indicators
            const userMessages = session.conversation.filter(t => t.role === "user");
            const avgLength = userMessages.length > 0
                ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
                : 0;

            const baseScore = Math.min(85, 40 + Math.floor(avgLength / 10) + session.questionsAsked * 5);

            scores = {
                technicalAccuracy: Math.min(100, baseScore + Math.floor(Math.random() * 15)),
                problemSolving: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
                communication: Math.min(100, baseScore + Math.floor(Math.random() * 12)),
                codeQuality: Math.min(100, baseScore + Math.floor(Math.random() * 8)),
                overall: baseScore,
                summary: `You completed a ${session.difficulty} ${session.topic} interview with ${session.questionsAsked} questions discussed. ${avgLength > 100 ? "Your responses were detailed and well-structured." : "Try to provide more detailed explanations."}`,
                strengths: ["Engaged with the interview process", "Covered key concepts"],
                improvements: ["Provide more code examples", "Explain time/space complexity"],
                recommendedTopics: ["Advanced " + session.topic, "System Design"],
            };
        }

        session.scores = {
            technicalAccuracy: scores.technicalAccuracy,
            problemSolving: scores.problemSolving,
            communication: scores.communication,
            codeQuality: scores.codeQuality,
            overall: scores.overall,
        };
        session.feedback = {
            summary: scores.summary,
            strengths: scores.strengths || [],
            improvements: scores.improvements || [],
            recommendedTopics: scores.recommendedTopics || [],
        };

        await session.save();

        res.json({ success: true, data: session });
    } catch (error) {
        console.error("End session error:", error.message);
        res.status(500).json({ message: "Failed to end session", error: error.message });
    }
};

/**
 * GET /api/ai-interview/history
 * Get past AI interview sessions for the authenticated user.
 */
exports.getHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            AIInterviewSession.find({ userId: req.user._id })
                .select("-conversation") // exclude full conversation for list view
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AIInterviewSession.countDocuments({ userId: req.user._id }),
        ]);

        res.json({
            success: true,
            data: sessions,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get history error:", error.message);
        res.status(500).json({ message: "Failed to get history", error: error.message });
    }
};

/**
 * GET /api/ai-interview/:id
 * Get a specific session with full conversation.
 */
exports.getSession = async (req, res) => {
    try {
        const session = await AIInterviewSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        }).lean();

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        res.json({ success: true, data: session });
    } catch (error) {
        console.error("Get session error:", error.message);
        res.status(500).json({ message: "Failed to get session", error: error.message });
    }
};

// ── Mock Helpers (for when API key is not available) ──

function getMockQuestion(topic, difficulty, type) {
    const questions = {
        dsa: {
            Easy: `Hello! I'm your AI interviewer today. Let's discuss **${topic}**.\n\nHere's your first question:\n\n**Given an array of integers, write a function to find the two numbers that add up to a specific target. Return their indices.**\n\nFor example:\n\`\`\`\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\n\`\`\`\n\nHow would you approach this problem? Walk me through your thought process.`,
            Medium: `Hello! I'm your AI interviewer today. Let's dive into **${topic}**.\n\nHere's your question:\n\n**Design an algorithm to find the longest substring without repeating characters in a given string.**\n\nFor example:\n\`\`\`\nInput: "abcabcbb"\nOutput: 3 (the substring is "abc")\n\`\`\`\n\nWhat approach would you take? Please explain the time and space complexity.`,
            Hard: `Hello! Welcome to this technical interview on **${topic}**.\n\nHere's a challenging problem:\n\n**Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.**\n\nFor example:\n\`\`\`\nInput: [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\n\`\`\`\n\nWalk me through your approach, considering multiple solutions and their trade-offs.`,
        },
    };

    return questions[type]?.[difficulty] || questions.dsa[difficulty || "Medium"];
}

function getMockFollowUp(topic, questionNumber) {
    const followUps = [
        `Good attempt! Let me ask a follow-up:\n\n**What is the time complexity of your solution?** Can you optimize it further? Think about what data structure might help reduce the complexity.`,
        `Interesting approach! Now consider:\n\n**How would your solution handle edge cases?** For example:\n- Empty input\n- Single element\n- All identical elements\n- Very large inputs\n\nHow would you modify your code?`,
        `Nice thinking! Let's go deeper:\n\n**Can you think of an alternative approach?** Compare the trade-offs between your current solution and the alternative in terms of:\n- Time complexity\n- Space complexity\n- Code readability`,
        `Great discussion! One more question:\n\n**How would you test this solution?** What test cases would you write? Think about:\n- Normal cases\n- Boundary cases\n- Performance/stress tests`,
        `Excellent! Final question:\n\n**In a real production environment, what considerations would you have?** Think about:\n- Scalability\n- Error handling\n- Code maintainability\n- Monitoring`,
    ];

    return followUps[Math.min(questionNumber - 1, followUps.length - 1)];
}
