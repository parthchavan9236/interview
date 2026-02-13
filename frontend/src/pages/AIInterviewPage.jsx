import { useState, useEffect, useRef } from "react";
import { startAIInterview, sendInterviewMessage, endAIInterview, getInterviewHistory } from "../lib/api";
import ReactMarkdown from "react-markdown";

const TOPICS = [
    "Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming",
    "Sorting & Searching", "Stacks & Queues", "Hash Tables", "Recursion",
    "System Design", "OOP Concepts", "Database Design", "React.js", "Node.js", "REST APIs"
];

const TYPES = [
    { value: "dsa", label: "Data Structures & Algorithms" },
    { value: "system_design", label: "System Design" },
    { value: "behavioral", label: "Behavioral" },
    { value: "frontend", label: "Frontend Development" },
    { value: "backend", label: "Backend Development" },
    { value: "general", label: "General Technical" },
];

export default function AIInterviewPage() {
    const [view, setView] = useState("setup"); // setup | active | results | history
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [interviewType, setInterviewType] = useState("dsa");
    const [session, setSession] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [session?.conversation]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await getInterviewHistory();
            setHistory(res.data.data || []);
        } catch { setHistory([]); }
        setHistoryLoading(false);
    };

    const handleStart = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const res = await startAIInterview({ topic, difficulty, interviewType });
            setSession(res.data.data);
            setView("active");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to start interview");
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!message.trim() || loading) return;
        setLoading(true);
        const userMsg = message;
        setMessage("");
        // Optimistic update
        setSession(prev => ({
            ...prev,
            conversation: [...prev.conversation, { role: "user", content: userMsg, timestamp: new Date() }]
        }));
        try {
            const res = await sendInterviewMessage(session._id, userMsg);
            setSession(prev => ({
                ...prev,
                conversation: [...prev.conversation, { role: "ai", content: res.data.data.message, timestamp: new Date() }],
                questionsAsked: res.data.data.questionsAsked,
            }));
        } catch { /* keep optimistic state */ }
        setLoading(false);
    };

    const handleEnd = async () => {
        setLoading(true);
        try {
            const res = await endAIInterview(session._id);
            setSession(res.data.data);
            setView("results");
        } catch (err) {
            alert("Failed to end session");
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Setup View ──
    if (view === "setup") {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-3">
                        🤖 AI Interview Simulator
                    </h1>
                    <p className="text-gray-400 text-lg">Practice technical interviews with an AI interviewer. Get real-time feedback and scoring.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Configuration */}
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">⚙</span>
                            Configure Interview
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="e.g. Binary Trees, System Design..."
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                                    list="topics"
                                />
                                <datalist id="topics">
                                    {TOPICS.map(t => <option key={t} value={t} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Difficulty</label>
                                <div className="flex gap-3">
                                    {["Easy", "Medium", "Hard"].map(d => (
                                        <button key={d} onClick={() => setDifficulty(d)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${difficulty === d
                                                ? d === "Easy" ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                                    : d === "Medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                                                : "bg-gray-900/50 text-gray-400 border border-gray-700 hover:border-gray-500"
                                                }`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Interview Type</label>
                                <select value={interviewType} onChange={e => setInterviewType(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition">
                                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <button onClick={handleStart} disabled={loading || !topic.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                                {loading ? <span className="animate-spin">⏳</span> : "🚀"} Start Interview
                            </button>
                        </div>
                    </div>

                    {/* Quick Start / History */}
                    <div className="space-y-6">
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h2 className="text-xl font-semibold text-white mb-4">⚡ Quick Start</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {TOPICS.slice(0, 8).map(t => (
                                    <button key={t} onClick={() => { setTopic(t); }}
                                        className="bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:border-blue-500/50 hover:text-blue-400 transition text-left">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => { loadHistory(); setView("history"); }}
                            className="w-full bg-gray-800/60 rounded-2xl p-4 border border-gray-700 hover:border-purple-500/50 transition flex items-center justify-between">
                            <span className="text-white font-medium">📋 View Past Interviews</span>
                            <span className="text-gray-400">→</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active Interview ──
    if (view === "active") {
        return (
            <div className="max-w-4xl mx-auto p-6 flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>
                {/* Header */}
                <div className="flex items-center justify-between bg-gray-800/60 rounded-2xl p-4 border border-gray-700 mb-4">
                    <div>
                        <h2 className="text-white font-semibold">{topic} — {difficulty}</h2>
                        <p className="text-sm text-gray-400">Questions: {session?.questionsAsked || 0} | {TYPES.find(t => t.value === interviewType)?.label}</p>
                    </div>
                    <button onClick={handleEnd}
                        className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/30 transition">
                        End Interview
                    </button>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                    {session?.conversation?.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === "user"
                                ? "bg-blue-600/30 text-blue-100 border border-blue-500/30"
                                : "bg-gray-800/80 text-gray-200 border border-gray-700"
                                }`}>
                                <p className="text-xs font-medium mb-1 opacity-70">
                                    {msg.role === "ai" ? "🤖 Interviewer" : "👤 You"}
                                </p>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl px-5 py-3">
                                <p className="text-gray-400 animate-pulse">🤖 Interviewer is typing...</p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="bg-gray-800/60 rounded-2xl border border-gray-700 p-3 flex gap-3">
                    <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                        rows={2} className="flex-1 bg-transparent text-white resize-none focus:outline-none placeholder-gray-500" />
                    <button onClick={handleSend} disabled={loading || !message.trim()}
                        className="bg-blue-600 text-white px-5 rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50 transition self-end">
                        Send
                    </button>
                </div>
            </div>
        );
    }

    // ── Results View ──
    if (view === "results" && session) {
        const s = session.scores || {};
        const fb = session.feedback || {};
        const scoreColor = (v) => v >= 70 ? "text-green-400" : v >= 50 ? "text-yellow-400" : "text-red-400";

        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Interview Complete! 🎉</h1>
                    <p className="text-gray-400">{topic} — {difficulty} — {Math.round((session.duration || 0) / 60)} min</p>
                </div>

                <div className="grid md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: "Overall", value: s.overall },
                        { label: "Technical", value: s.technicalAccuracy },
                        { label: "Problem Solving", value: s.problemSolving },
                        { label: "Communication", value: s.communication },
                        { label: "Code Quality", value: s.codeQuality },
                    ].map(item => (
                        <div key={item.label} className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700 text-center">
                            <p className={`text-3xl font-bold ${scoreColor(item.value)}`}>{item.value ?? "—"}</p>
                            <p className="text-gray-400 text-sm mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-green-400 font-semibold mb-3">💪 Strengths</h3>
                        <ul className="space-y-2">
                            {(fb.strengths || []).map((s, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span>{s}</li>)}
                        </ul>
                    </div>
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-yellow-400 font-semibold mb-3">📈 Areas to Improve</h3>
                        <ul className="space-y-2">
                            {(fb.improvements || []).map((s, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-yellow-400 mt-0.5">→</span>{s}</li>)}
                        </ul>
                    </div>
                </div>

                {fb.summary && (
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700 mb-8">
                        <h3 className="text-blue-400 font-semibold mb-2">📝 Summary</h3>
                        <p className="text-gray-300">{fb.summary}</p>
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    <button onClick={() => { setSession(null); setView("setup"); }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition">
                        Start New Interview
                    </button>
                    <button onClick={() => { loadHistory(); setView("history"); }}
                        className="bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 transition">
                        View History
                    </button>
                </div>
            </div>
        );
    }

    // ── History View ──
    if (view === "history") {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">📋 Interview History</h1>
                    <button onClick={() => setView("setup")}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-500 transition">
                        + New Interview
                    </button>
                </div>

                {historyLoading ? (
                    <div className="text-center py-12 text-gray-400">Loading...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16 bg-gray-800/60 rounded-2xl border border-gray-700">
                        <p className="text-5xl mb-4">🎤</p>
                        <p className="text-white text-lg font-medium">No interviews yet</p>
                        <p className="text-gray-400 mt-1">Start your first AI interview to see results here!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(s => (
                            <div key={s._id} className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700 flex items-center justify-between hover:border-gray-600 transition">
                                <div>
                                    <h3 className="text-white font-medium">{s.topic}</h3>
                                    <p className="text-sm text-gray-400">{s.difficulty} • {s.interviewType} • {s.questionsAsked} questions • {new Date(s.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {s.scores?.overall != null && (
                                        <span className={`text-2xl font-bold ${s.scores.overall >= 70 ? "text-green-400" : s.scores.overall >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                            {s.scores.overall}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === "completed" ? "bg-green-500/20 text-green-400" : s.status === "active" ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-400"}`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
