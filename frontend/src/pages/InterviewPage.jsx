import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../lib/useAuth";
import SimplePeer from "simple-peer";
import CodeEditor from "../components/CodeEditor";
import Whiteboard from "../components/Whiteboard"; // Import Whiteboard
import LoadingSpinner from "../components/LoadingSpinner";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Copy, Code, PenTool } from "lucide-react";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { executeCode } from "../lib/api"; // Import executeCode

// Global socket instance for this page if not using context
let socket;

export default function InterviewPage() {
    const { id: roomId } = useParams(); // Using slot ID as room ID
    const { user } = useUser();
    const navigate = useNavigate();

    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [peerConnected, setPeerConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showChat, setShowChat] = useState(true);

    // Advanced Features State
    const [activeTab, setActiveTab] = useState("code"); // 'code' or 'whiteboard'
    const [code, setCode] = useState("// Write your solution here\nconsole.log('Hello, World!');");
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);

    const myVideo = useRef();
    const remoteVideo = useRef();
    const connectionRef = useRef();
    const messagesEndRef = useRef();

    useEffect(() => {
        socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }

                socket.emit("join-room", roomId, user._id);

                socket.on("user-connected", (userId) => {
                    console.log("User connected:", userId);
                    // Initiate call
                    callUser(userId, currentStream);
                });

                socket.on("call-made", async (data) => {
                    console.log("Receiving call from", data.socket);
                    await answerCall(data, currentStream);
                });

                socket.on("answer-made", async (data) => {
                    console.log("Call answered by", data.socket);
                    await handleAnswer(data);
                });

                socket.on("ice-candidate", async (data) => {
                    if (connectionRef.current) {
                        try {
                            await connectionRef.current.signal(data.candidate);
                        } catch (e) {
                            console.error("Error adding ice candidate", e);
                        }
                    }
                });

                socket.on("receive-message", (message) => {
                    setMessages((prev) => [...prev, { ...message, isMe: false }]);
                });

                // Code collaboration events
                socket.on("code-change", (newCode) => {
                    setCode(newCode);
                });

                socket.on("language-change", (newLang) => {
                    setLanguage(newLang);
                });

                socket.on("code-output", (newOutput) => {
                    setOutput(newOutput);
                });

                // Sync initial whiteboard/code state if needed (advanced)
            })
            .catch((err) => {
                console.error("Media access error:", err);
                if (err.name === 'NotAllowedError') {
                    toast.error("Permission denied. Please allow camera/microphone access in your browser settings.");
                } else if (err.name === 'NotFoundError') {
                    toast.error("No camera or microphone found on this device.");
                } else {
                    toast.error(`Could not access camera/microphone: ${err.message}`);
                }
            });

        return () => {
            if (socket) socket.disconnect();
            if (stream) stream.getTracks().forEach((track) => track.stop());
            if (connectionRef.current) connectionRef.current.destroy();
        };
    }, [roomId, user]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const callUser = (userId, stream) => {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            socket.emit("call-user", {
                offer: data,
                roomId: roomId,
                from: socket.id,
                user: user
            });
        });

        peer.on("stream", (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("connect", () => {
            setPeerConnected(true);
            toast.success("Peer connected!");
        });

        connectionRef.current = peer;
    };

    const answerCall = (data, stream) => {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("make-answer", {
                answer: signal,
                to: data.socket
            });
        });

        peer.on("stream", (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("connect", () => {
            setPeerConnected(true);
            toast.success("Peer connected!");
        });

        peer.signal(data.offer);
        connectionRef.current = peer;
    };

    const handleAnswer = (data) => {
        if (connectionRef.current) {
            connectionRef.current.signal(data.answer);
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !isMicOn;
            setIsMicOn(!isMicOn);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !isVideoOn;
            setIsVideoOn(!isVideoOn);
        }
    };

    const leaveCall = () => {
        navigate("/interviews");
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = { text: newMessage, sender: user.name, time: new Date().toISOString() };
        setMessages((prev) => [...prev, { ...msgData, isMe: true }]);
        socket.emit("send-message", roomId, msgData);
        setNewMessage("");
    };

    // --- Advanced Features Handlers ---

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        socket.emit("code-change", roomId, newCode);
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        socket.emit("language-change", roomId, newLang);
    };

    const handleRunCode = async (codeToRun, langToRun) => {
        setIsRunning(true);
        setOutput("Running...");

        // Notify others that code is running (optional)

        try {
            const res = await executeCode(langToRun, codeToRun);
            const result = res.data.run.output || res.data.run.stderr || "No output";
            setOutput(result);
            socket.emit("code-output", roomId, result);
        } catch (error) {
            const errOutput = "Error executing code: " + (error.response?.data?.message || error.message);
            setOutput(errOutput);
            socket.emit("code-output", roomId, errOutput);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-dark-50">
            {/* Left Panel: Video & Code */}
            <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
                {/* Video Strip */}
                <div className="h-48 sm:h-64 flex gap-4 bg-dark-200 rounded-xl p-2 overflow-x-auto shrink-0 relative">
                    {/* My Video */}
                    <div className="relative w-full sm:w-1/2 md:w-1/3 bg-black rounded-lg overflow-hidden border border-dark-400">
                        <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover transform scale-x-[-1]" />
                        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                            You {isMicOn ? "" : "(Mic Off)"}
                        </div>
                    </div>

                    {/* Remote Video */}
                    {remoteStream ? (
                        <div className="relative w-full sm:w-1/2 md:w-1/3 bg-black rounded-lg overflow-hidden border border-dark-400">
                            <video playsInline ref={remoteVideo} autoPlay className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full sm:w-1/2 md:w-1/3 bg-dark-300 rounded-lg border border-dark-400 border-dashed">
                            <div className="text-center p-4">
                                <LoadingSpinner size="sm" />
                                <p className="text-sm text-gray-400 mt-2">Waiting for user to join...</p>
                                <div className="mt-2 flex items-center justify-center gap-2 cursor-pointer text-primary-400 text-xs hover:underline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied!");
                                    }}
                                >
                                    <Copy className="w-3 h-3" /> Copy Link
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workspace Tabs */}
                <div className="flex-1 bg-dark-200 rounded-xl border border-dark-400 overflow-hidden flex flex-col">
                    <div className="flex border-b border-dark-400">
                        <button
                            onClick={() => setActiveTab("code")}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === "code" ? "bg-dark-200 text-white border-b-2 border-primary-500" : "bg-dark-300/50 text-gray-400 hover:text-white"
                                }`}
                        >
                            <Code className="w-4 h-4" /> Code
                        </button>
                        <button
                            onClick={() => setActiveTab("whiteboard")}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === "whiteboard" ? "bg-dark-200 text-white border-b-2 border-primary-500" : "bg-dark-300/50 text-gray-400 hover:text-white"
                                }`}
                        >
                            <PenTool className="w-4 h-4" /> Whiteboard
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        {activeTab === "code" ? (
                            <CodeEditor
                                defaultCode={code}
                                language={language}
                                onCodeChange={handleCodeChange}
                                onLanguageChange={handleLanguageChange}
                                onRun={handleRunCode}
                                isRunning={isRunning}
                                output={output}
                                height="100%"
                            />
                        ) : (
                            <Whiteboard socket={socket} roomId={roomId} />
                        )}
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="h-16 bg-dark-200 rounded-xl border border-dark-400 flex items-center justify-center gap-4 shrink-0">
                    <button
                        onClick={toggleMic}
                        className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-dark-300 hover:bg-dark-400 text-white' : 'bg-red-500/20 text-red-500'}`}
                    >
                        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-all ${isVideoOn ? 'bg-dark-300 hover:bg-dark-400 text-white' : 'bg-red-500/20 text-red-500'}`}
                    >
                        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={leaveCall}
                        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
                    >
                        <PhoneOff className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-3 rounded-full lg:hidden transition-all ${showChat ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Right Panel: Chat (Collapsible on mobile) */}
            {showChat && (
                <div className="w-full lg:w-80 bg-dark-200 border-l border-dark-400 flex flex-col shrink-0 absolute lg:relative z-10 h-full lg:h-auto top-0 right-0 lg:top-auto lg:right-auto">
                    <div className="p-4 border-b border-dark-400 bg-dark-300/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-200">Chat</h3>
                        <button onClick={() => setShowChat(false)} className="lg:hidden text-gray-400"><Video /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${msg.isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-dark-300 text-gray-200 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1">
                                    {msg.isMe ? 'You' : msg.sender} • {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-3 border-t border-dark-400 bg-dark-300/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-dark-100 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                            />
                            <button type="submit" className="btn-primary p-2 rounded-lg">
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
