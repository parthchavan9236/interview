import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import api from "../lib/api";
import ReactMarkdown from "react-markdown";

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I'm GOD Ai. Ask me anything about coding, system design, or interview tips!" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await api.post("/ai/chat", { message: userMsg.text });
            setMessages(prev => [...prev, { role: "assistant", text: res.data.message }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-xl hover:scale-110 transition-transform z-50 flex items-center gap-2"
            >
                {isOpen ? <X className="w-6 h-6" /> : <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">GOD Ai</span></div>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-dark-200 border border-dark-400 rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-dark-300 to-dark-200 border-b border-dark-400 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">GOD Ai</h3>
                            <div className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-dark-300" : "bg-primary-500/20"
                                    }`}>
                                    {msg.role === "user" ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-primary-400" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.role === "user"
                                    ? "bg-primary-600 text-white rounded-tr-none"
                                    : "bg-dark-300 text-gray-200 rounded-tl-none border border-dark-400"
                                    }`}>
                                    <ReactMarkdown
                                        components={{
                                            code: ({ node, ...props }) => <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-xs" {...props} />
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-primary-400" />
                                </div>
                                <div className="bg-dark-300 p-3 rounded-2xl rounded-tl-none border border-dark-400 flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 border-t border-dark-400 bg-dark-300/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="flex-1 bg-dark-100 border border-dark-400 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
