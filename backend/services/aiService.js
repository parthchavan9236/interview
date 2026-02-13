// This is a structure for the AI service. 
// You would need to add your OpenAI API key to .env as OPENAI_API_KEY

const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

exports.generateHint = async (problemDescription, code) => {
    if (!process.env.OPENAI_API_KEY) {
        return "This is a mock hint. Configure OPENAI_API_KEY to get real AI hints.";
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful coding tutor. Provide a hint for the user's code without giving the full solution." },
                { role: "user", content: `Problem: ${problemDescription}\n\nUser Code:\n${code}` }
            ],
            model: "gpt-3.5-turbo",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("AI Hint Error:", error);
        throw new Error("Failed to generate hint");
    }
};

exports.reviewCode = async (code, language) => {
    if (!process.env.OPENAI_API_KEY) {
        return "This is a mock code review. Your code looks unstructured. Add comments and optimize loops.";
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a senior code reviewer. Analyze the code for time complexity, space complexity, and best practices." },
                { role: "user", content: `Language: ${language}\n\nCode:\n${code}` }
            ],
            model: "gpt-3.5-turbo",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("AI Review Error:", error);
        throw new Error("Failed to review code");
    }
};

exports.generateInterviewFeedback = async (interviewData) => {
    if (!process.env.OPENAI_API_KEY) {
        return { rating: 4, comments: "Good communication, but work on edge cases." };
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are an interviewer. specialized in technical interviews. Provide feedback based on the session notes and code." },
                { role: "user", content: JSON.stringify(interviewData) }
            ],
            model: "gpt-3.5-turbo",
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("AI Interview Feedback Error:", error);
        throw new Error("Failed to generate feedback");
    }
};
