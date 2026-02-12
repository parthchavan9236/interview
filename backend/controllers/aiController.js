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
