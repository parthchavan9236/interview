// Execute code without test cases
const executeCode = async (req, res) => {
    try {
        const { code, language, input } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Code is required" });
        }

        const lang = language || "javascript";
        const langMap = {
            javascript: { language: "javascript", version: "18.15.0", file: "code.js" },
            python: { language: "python", version: "3.10.0", file: "code.py" },
            java: { language: "java", version: "15.0.2", file: "Main.java" },
            cpp: { language: "c++", version: "10.2.0", file: "code.cpp" },
            go: { language: "go", version: "1.16.2", file: "main.go" },
            rust: { language: "rust", version: "1.68.2", file: "main.rs" },
        };

        const langConfig = langMap[lang] || langMap.javascript;

        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: langConfig.language,
                version: langConfig.version,
                files: [
                    {
                        name: langConfig.file,
                        content: code,
                    },
                ],
                stdin: input || "",
                run_timeout: 10000,
            }),
        });

        const data = await response.json();

        res.status(200).json({
            output: data.run?.stdout || "",
            stderr: data.run?.stderr || "",
            exitCode: data.run?.code || 0,
            signal: data.run?.signal || null,
        });
    } catch (error) {
        console.error("Code execution error:", error);
        res.status(500).json({
            message: "Code execution failed",
            error: error.message,
        });
    }
};

// Get supported languages
const getLanguages = async (req, res) => {
    try {
        const languages = [
            { id: "javascript", name: "JavaScript", version: "18.15.0" },
            { id: "python", name: "Python", version: "3.10.0" },
            { id: "java", name: "Java", version: "15.0.2" },
            { id: "cpp", name: "C++", version: "10.2.0" },
            { id: "go", name: "Go", version: "1.16.2" },
            { id: "rust", name: "Rust", version: "1.68.2" },
        ];
        res.status(200).json(languages);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { executeCode, getLanguages };
