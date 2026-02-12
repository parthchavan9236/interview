const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");

exports.getAIHint = async (req, res) => {
    const { code, problemTitle, language } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            message: "AI service unavailable (Missing API Key). Please set GEMINI_API_KEY in .env"
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `You are a helpful technical interviewer. The candidate is solving the problem "${problemTitle}" in ${language}.
        
        Current Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide a concise, helpful hint to guide them. Do not write the full solution. Focus on logic or syntax errors if any.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ message: text });
    } catch (error) {
        console.error("AI Hint Error:", error);
        res.status(500).json({ message: "Failed to generate hint" });
    }
};

exports.analyzeCode = async (req, res) => {
    const { code, problemTitle, language } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            message: "AI service unavailable (Missing API Key). Please set GEMINI_API_KEY in .env"
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Analyze the following ${language} code for the problem "${problemTitle}".
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide:
        1. Time Complexity
        2. Space Complexity
        3. Potential Bugs or Edge Cases missed
        4. Brief suggestions for improvement
        
        Keep it structured and professional.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ message: text });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: "Failed to analyze code" });
    }
};

exports.chatWithAI = async (req, res) => {
    const { message, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        // Mock Response for Demo/Development
        console.log("No GEMINI_API_KEY found. Using mock response.");

        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockResponses = [
            "That's a great question! In a real interview, you should start by clarifying the requirements.",
            "I can help with that. Have you considered the time complexity of your approach?",
            "Remember to handle edge cases like empty inputs or negative numbers!",
            "For this problem, a hash map might be a good data structure to use.",
            "Make sure to test your code with the provided example cases.",
            "Focus on writing clean, readable code. It's just as important as the solution itself.",
            "You're doing great! Keep practicing and you'll ace your interview."
        ];

        // Simple keyword matching for better "fake" intelligence
        let reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
            reply = "Hello! I'm GOD Ai. Ready to practice?";
        } else if (lowerMsg.includes("complexity") || lowerMsg.includes("big o")) {
            reply = "Time and space complexity are crucial. Always analyze your algorithm's efficiency!";
        } else if (lowerMsg.includes("thanks") || lowerMsg.includes("thank you")) {
            reply = "You're welcome! Happy coding!";
        } else if (lowerMsg.includes("help")) {
            reply = "I'm here to help! Ask me about specific algorithms, data structures, or interview strategies.";
        }

        return res.json({
            message: reply
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let prompt = `You are an expert technical interviewer and coding mentor.
        User: ${message}`;

        if (context) {
            prompt = `Context: ${JSON.stringify(context)}\n` + prompt;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ message: text });
    } catch (error) {
        console.error("AI Chat Error Details:", error);
        res.status(500).json({
            message: "I'm having trouble connecting to my brain right now. Please check the server logs.",
            error: error.message
        });
    }
};
