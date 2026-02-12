import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useSocket = (roomId, user) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!roomId || !user) return;

        socketRef.current = io(SOCKET_URL, {
            query: { roomId, userId: user._id },
        });

        socketRef.current.on("connect", () => {
            setIsConnected(true);
            console.log("Socket connected");
            socketRef.current.emit("join-room", roomId, user._id);
        });

        socketRef.current.on("disconnect", () => {
            setIsConnected(false);
            console.log("Socket disconnected");
        });

        socketRef.current.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setIsConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId, user]);

    return { socket: socketRef.current, isConnected };
};
