import { useState, useRef, useEffect } from "react";
import { chatWithAI } from "../lib/api";
import { useAuth } from "../lib/useAuth";
import {
    MessageCircle, X, Send, Sparkles, Bot, User, Loader2,
    Trash2, Minimize2, Maximize2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const STORAGE_KEY = "ai_chat_history";

export default function AIAssistant() {
    const { isSignedIn } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Save to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); // Keep last 50
        }
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg = { role: "user", content: trimmed, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await chatWithAI({
                message: trimmed,
                history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            });
            const aiMsg = { role: "assistant", content: res.data.message, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg = {
                role: "assistant",
                content: "⚠️ Sorry, I couldn't process that request. Please try again.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Don't render for non-authenticated users
    if (!isSignedIn) return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
                    aria-label="Open AI Assistant"
                >
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {/* Notification dot */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-dark animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed z-50 transition-all duration-300 ${isMinimized
                            ? "bottom-6 right-6 w-72 h-14"
                            : "bottom-6 right-6 w-[90vw] sm:w-[420px] h-[70vh] sm:h-[600px] max-h-[calc(100vh-6rem)]"
                        }`}
                >
                    <div className="w-full h-full bg-dark-50 border border-dark-400/30 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-b border-dark-400/30 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white leading-tight">CodeInterview AI</h3>
                                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                        Online — Gemini Powered
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearHistory}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-dark-300/50 transition-all"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-300/50 transition-all"
                                    title={isMinimized ? "Maximize" : "Minimize"}
                                >
                                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-300/50 transition-all"
                                    title="Close"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                                    {/* Welcome Message */}
                                    {messages.length === 0 && (
                                        <div className="text-center py-8 space-y-4">
                                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-primary-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">Hi! I'm CodeInterview AI 👋</h4>
                                                <p className="text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                                                    I can answer any question — coding, algorithms, interviews, this project, or general knowledge!
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 max-w-[300px] mx-auto">
                                                {[
                                                    "Explain this project",
                                                    "What is Big O?",
                                                    "Help with Two Sum",
                                                    "Interview tips",
                                                ].map((q) => (
                                                    <button
                                                        key={q}
                                                        onClick={() => { setInput(q); }}
                                                        className="text-[11px] px-3 py-2 rounded-lg bg-dark-300/50 text-gray-400 hover:text-white hover:bg-dark-300 transition-all text-left"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Bubbles */}
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            {msg.role !== "user" && (
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Bot className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                                        ? "bg-primary-500 text-white rounded-br-md"
                                                        : "bg-dark-300/50 text-gray-200 rounded-bl-md"
                                                    }`}
                                            >
                                                {msg.role === "user" ? (
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                ) : (
                                                    <div className="prose prose-invert prose-sm max-w-none
                                                        prose-p:my-1.5 prose-headings:my-2 prose-li:my-0.5
                                                        prose-code:text-primary-300 prose-code:bg-dark-400/50 prose-code:px-1 prose-code:rounded
                                                        prose-pre:bg-dark-400/80 prose-pre:rounded-lg prose-pre:my-2
                                                        prose-table:text-xs prose-th:px-2 prose-td:px-2
                                                        prose-strong:text-white prose-a:text-primary-400">
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="w-7 h-7 rounded-lg bg-dark-300 flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="flex gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
                                                <Bot className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="bg-dark-300/50 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                                                <span className="text-xs text-gray-400">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 border-t border-dark-400/30 shrink-0">
                                    <div className="flex items-end gap-2">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask me anything..."
                                            className="flex-1 bg-dark-300/50 border border-dark-400/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all max-h-24"
                                            rows={1}
                                            style={{ minHeight: "40px" }}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                                        Powered by Google Gemini • Press Enter to send
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
