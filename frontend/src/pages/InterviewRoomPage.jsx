import { useState, useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useUser } from "../lib/useAuth";
import toast from "react-hot-toast";
import {
    getInterviewById,
    updateInterview,
    executeCode as execCode,
    getStreamToken,
    setAuthToken,
    getAIHint,
    analyzeCode,
} from "../lib/api";
import CodeEditor from "../components/CodeEditor";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Phone,
    MessageSquare,
    Code2,
    Send,
    X,
    Users,
    Clock,
    ArrowLeft,
    PenTool,
    Sparkles,
    Loader,
} from "lucide-react";
import Whiteboard from "../components/Whiteboard";

export default function InterviewRoomPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { user } = useUser();
    const chatEndRef = useRef(null);

    // Socket integration
    const { socket, isConnected } = useSocket(id, user);

    const [code, setCode] = useState(
        '// Welcome to the interview!\n// Write your code here\n\nfunction solution() {\n  console.log("Hello, World!");\n}\n\nsolution();'
    );
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [notes, setNotes] = useState("");
    const [activePanel, setActivePanel] = useState("code");

    // AI State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");
    const [aiAction, setAiAction] = useState(null); // 'hint' or 'analyze'

    const handleAIAction = async (action) => {
        setAiAction(action);
        setShowAIModal(true);
        setAiLoading(true);
        setAiResponse("");

        try {
            const token = await getToken();
            setAuthToken(token);

            const payload = {
                code,
                language,
                problemTitle: interview?.title || "Unknown Problem"
            };

            let res;
            if (action === "hint") {
                res = await getAIHint(payload);
            } else {
                res = await analyzeCode(payload);
            }
            setAiResponse(res.data.message);
        } catch (err) {
            setAiResponse("Failed to get AI response. Please check if GEMINI_API_KEY is configured in backend.");
        } finally {
            setAiLoading(false);
        }
    };

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on("code-change", (newCode) => {
            setCode(newCode);
        });

        socket.on("language-change", (newLang) => {
            setLanguage(newLang);
        });

        socket.on("receive-message", (message) => {
            setMessages((prev) => [...prev, {
                ...message,
                timestamp: new Date(message.timestamp) // Fix date serialization
            }]);
        });

        return () => {
            socket.off("code-change");
            socket.off("language-change");
            socket.off("receive-message");
        }
    }, [socket]);

    // Handlers
    const handleCodeUpdate = (newCode) => {
        setCode(newCode);
        if (socket) {
            socket.emit("code-change", id, newCode);
        }
    };

    const handleLanguageUpdate = (newLang) => {
        setLanguage(newLang);
        if (socket) {
            socket.emit("language-change", id, newLang);
        }
    };

    // Prevent body scroll when chat is open on mobile
    useEffect(() => {
        if (showChat && window.innerWidth < 768) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [showChat]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const { data: interview, isLoading } = useQuery({
        queryKey: ["interview", id],
        queryFn: async () => {
            const token = await getToken();
            setAuthToken(token);
            const res = await getInterviewById(id);
            return res.data;
        },
    });

    useEffect(() => {
        const markInProgress = async () => {
            if (interview && interview.status === "scheduled") {
                try {
                    const token = await getToken();
                    setAuthToken(token);
                    await updateInterview(id, { status: "in_progress" });
                } catch (err) {
                    console.error("Failed to update interview status:", err);
                }
            }
        };
        markInProgress();
    }, [interview]);

    const handleRun = async (codeText, lang) => {
        setIsRunning(true);
        try {
            const token = await getToken();
            setAuthToken(token);
            const res = await execCode({
                code: codeText,
                language: lang,
                input: "",
            });
            const data = res.data;
            if (data.stderr) {
                setOutput(`Error:\n${data.stderr}`);
            } else {
                setOutput(data.output || "(no output)");
            }
        } catch (err) {
            setOutput(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            id: Date.now(),
            text: newMessage,
            sender: user?.fullName || "You",
            timestamp: new Date(), // This will be stringified over socket, careful with dates
        };

        // Optimistic update
        setMessages((prev) => [...prev, messageData]);

        if (socket) {
            socket.emit("send-message", id, messageData);
        }

        setNewMessage("");
    };

    const handleEndInterview = async () => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await updateInterview(id, {
                status: "completed",
                notes,
            });
            toast.success("Interview ended");
            navigate("/interviews");
        } catch (err) {
            toast.error("Failed to end interview");
        }
    };

    if (isLoading) return <LoadingSpinner text="Loading interview room..." />;
    if (!interview) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400">Interview not found</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-dark-50 border-b border-dark-400/30 px-3 sm:px-4 py-2 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => navigate("/interviews")}
                        className="p-2 rounded-lg hover:bg-dark-300/50 text-gray-400 hover:text-white transition-all touch-target flex-shrink-0"
                        aria-label="Back to interviews"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-white truncate">
                            {interview.title}
                        </h2>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                                {interview.candidate?.name ||
                                    interview.candidateEmail ||
                                    "No candidate"}
                            </span>
                            <span className="text-dark-400">•</span>
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {new Date(interview.scheduledAt).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {/* Panel Toggle */}
                    <div className="flex gap-0.5 bg-dark-100 border border-dark-400/30 rounded-lg p-0.5">
                        <button
                            onClick={() => setActivePanel("code")}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activePanel === "code"
                                ? "bg-primary-500/20 text-primary-400"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <Code2 className="w-3 h-3" />
                            <span className="hidden xs:inline">Code</span>
                        </button>
                        <button
                            onClick={() => setActivePanel("video")}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activePanel === "video"
                                ? "bg-primary-500/20 text-primary-400"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <Video className="w-3 h-3" />
                            <span className="hidden xs:inline">Video</span>
                        </button>
                        <button
                            onClick={() => setActivePanel("whiteboard")}
                            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activePanel === "whiteboard"
                                ? "bg-primary-500/20 text-primary-400"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <PenTool className="w-3 h-3" />
                            <span className="hidden xs:inline">Board</span>
                        </button>
                    </div>

                    {/* Chat Toggle */}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-2 rounded-lg transition-all touch-target relative ${showChat
                            ? "bg-primary-500/20 text-primary-400"
                            : "hover:bg-dark-300/50 text-gray-400 hover:text-white"
                            }`}
                        aria-label="Toggle chat"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {messages.length > 0 && !showChat && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                    </button>

                    {/* Ask AI */}
                    <button
                        onClick={() => handleAIAction("analyze")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-all border border-purple-500/30"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ask AI</span>
                    </button>

                    {/* End Interview */}
                    <button
                        onClick={handleEndInterview}
                        className="btn-danger text-xs px-3 sm:px-4 py-2 flex items-center gap-1.5"
                    >
                        <Phone className="w-3.5 h-3.5 rotate-[135deg]" />
                        <span className="hidden sm:inline">End</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Code / Video Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activePanel === "code" && (
                        <CodeEditor
                            defaultCode={code}
                            language={language}
                            onLanguageChange={handleLanguageUpdate}
                            onCodeChange={handleCodeUpdate}
                            onRun={handleRun}
                            isRunning={isRunning}
                            output={output}
                            height="100%"
                        />
                    )}

                    {activePanel === "video" && (
                        /* Video Panel */
                        <div className="flex-1 flex flex-col items-center justify-center bg-dark-100 p-4 sm:p-6 overflow-auto">
                            {/* Video Preview Area */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-3xl mb-6 sm:mb-8">
                                {/* Your Video */}
                                <div className="aspect-video bg-dark-300/50 rounded-2xl border border-dark-400/30 flex flex-col items-center justify-center relative overflow-hidden">
                                    {isCameraOn ? (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-900/30 to-purple-900/30 flex items-center justify-center">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                                                {user?.firstName?.[0] || "Y"}
                                            </div>
                                        </div>
                                    ) : (
                                        <VideoOff className="w-8 h-8 sm:w-10 sm:h-10 text-dark-500" />
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg text-xs text-gray-300">
                                        You
                                    </div>
                                </div>

                                {/* Other Participant */}
                                <div className="aspect-video bg-dark-300/50 rounded-2xl border border-dark-400/30 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-emerald-900/20 to-teal-900/20 flex items-center justify-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                                            {interview.candidate?.name?.[0] ||
                                                interview.interviewer?.name?.[0] ||
                                                "?"}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg text-xs text-gray-300">
                                        {interview.candidate?.name ||
                                            interview.interviewer?.name ||
                                            "Participant"}
                                    </div>
                                </div>
                            </div>

                            {/* Video Controls */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    onClick={() => setIsMicOn(!isMicOn)}
                                    className={`p-3 sm:p-4 rounded-full transition-all touch-target ${isMicOn
                                        ? "bg-dark-300 hover:bg-dark-400 text-white"
                                        : "bg-red-500 hover:bg-red-600 text-white"
                                        }`}
                                    aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                                >
                                    {isMicOn ? (
                                        <Mic className="w-5 h-5" />
                                    ) : (
                                        <MicOff className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsCameraOn(!isCameraOn)}
                                    className={`p-3 sm:p-4 rounded-full transition-all touch-target ${isCameraOn
                                        ? "bg-dark-300 hover:bg-dark-400 text-white"
                                        : "bg-red-500 hover:bg-red-600 text-white"
                                        }`}
                                    aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
                                >
                                    {isCameraOn ? (
                                        <Video className="w-5 h-5" />
                                    ) : (
                                        <VideoOff className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Notes */}
                            <div className="w-full max-w-xl mt-6 sm:mt-8">
                                <label className="text-sm text-gray-400 mb-2 block">
                                    Interview Notes
                                </label>
                                <textarea
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Take notes during the interview..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <p className="text-xs text-gray-600 mt-4 text-center px-4">
                                💡 Configure Stream API keys in .env to enable live video.
                                Currently showing preview UI.
                            </p>
                        </div>
                    )}
                    {activePanel === "whiteboard" && (
                        <Whiteboard socket={socket} roomId={id} />
                    )}
                </div>

                {/* Chat Sidebar — Desktop: side panel, Mobile: overlay */}
                {showChat && (
                    <>
                        {/* Mobile overlay backdrop */}
                        <div
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setShowChat(false)}
                        />

                        <div className="fixed md:relative inset-x-0 bottom-0 md:inset-auto md:w-80 h-[70vh] md:h-auto border-t md:border-t-0 md:border-l border-dark-400/30 flex flex-col bg-dark-50 z-50 rounded-t-2xl md:rounded-none animate-slide-in-bottom md:animate-fade-in safe-bottom">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-400/20">
                                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary-400" />
                                    Chat
                                </h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="p-1.5 rounded-lg hover:bg-dark-300/50 text-gray-500 hover:text-gray-300 touch-target"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                                        <p className="text-xs text-gray-600">No messages yet</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className="animate-fade-in">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-primary-400">
                                                    {msg.sender}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {msg.timestamp.toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <div className="bg-dark-200 rounded-xl px-3 py-2 text-sm text-gray-300">
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Message Input */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-3 border-t border-dark-400/20"
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input-field text-sm py-2.5"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all touch-target flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* AI Modal */}
            {showAIModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-100 border border-dark-300 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-300 bg-dark-50/50">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                AI Assistant
                            </h3>
                            <button
                                onClick={() => setShowAIModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
                            {!aiResponse && !aiLoading && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleAIAction("hint")}
                                        className="p-4 rounded-xl bg-dark-200 hover:bg-dark-300 border border-dark-400 transition-all text-left group"
                                    >
                                        <div className="p-2 w-fit rounded-lg bg-emerald-500/20 text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-medium text-white mb-1">Get a Hint</h4>
                                        <p className="text-xs text-gray-400">Stuck? Get a nudge in the right direction.</p>
                                    </button>
                                    <button
                                        onClick={() => handleAIAction("analyze")}
                                        className="p-4 rounded-xl bg-dark-200 hover:bg-dark-300 border border-dark-400 transition-all text-left group"
                                    >
                                        <div className="p-2 w-fit rounded-lg bg-blue-500/20 text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                            <Code2 className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-medium text-white mb-1">Analyze Code</h4>
                                        <p className="text-xs text-gray-400">Check complexity and potential bugs.</p>
                                    </button>
                                </div>
                            )}

                            {aiLoading && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                                    <p className="text-sm text-gray-400 animate-pulse">Consulting the oracle...</p>
                                </div>
                            )}

                            {aiResponse && (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                                        {aiResponse}
                                    </div>
                                </div>
                            )}
                        </div>

                        {aiResponse && (
                            <div className="px-4 py-3 bg-dark-50/50 border-t border-dark-300 flex justify-end">
                                <button
                                    onClick={() => { setAiResponse(""); setAiLoading(false); }}
                                    className="text-xs text-gray-400 hover:text-white underline mr-4"
                                >
                                    Ask something else
                                </button>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white text-xs font-medium rounded-lg transition-colors border border-dark-400"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
