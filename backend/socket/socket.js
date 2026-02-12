const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join-room", (roomId, userId) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room ${roomId}`);
            socket.to(roomId).emit("user-connected", userId);
        });

        socket.on("code-change", (roomId, code) => {
            socket.to(roomId).emit("code-change", code);
        });

        socket.on("language-change", (roomId, language) => {
            socket.to(roomId).emit("language-change", language);
        });

        socket.on("send-message", (roomId, message) => {
            socket.to(roomId).emit("receive-message", message);
        });

        socket.on("whiteboard-change", (roomId, data) => {
            socket.to(roomId).emit("whiteboard-change", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
