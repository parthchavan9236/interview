import { useRef, useEffect, useState } from "react";
import { Eraser, Pen, Trash2, Undo } from "lucide-react";

export default function Whiteboard({ socket, roomId }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#ffffff");
    const [lineWidth, setLineWidth] = useState(2);
    const [tool, setTool] = useState("pen"); // pen, eraser

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Set canvas size
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Restore styles
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
            }
        };
        resize();
        window.addEventListener("resize", resize);

        // Socket listener for drawing
        if (socket) {
            socket.on("whiteboard-change", (data) => {
                if (data.type === "draw") {
                    drawOnCanvas(data.x0, data.y0, data.x1, data.y1, data.color, data.width);
                } else if (data.type === "clear") {
                    clearCanvas();
                }
            });
        }

        return () => {
            window.removeEventListener("resize", resize);
            if (socket) socket.off("whiteboard-change");
        };
    }, [socket, roomId]);

    // Update context styles when state changes
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = tool === "eraser" ? "#1a1a2e" : color; // Eraser matches bg
        ctx.lineWidth = lineWidth;
    }, [color, lineWidth, tool]);

    const startDrawing = (e) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.beginPath(); // Reset path
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();

        // Calculate coordinates
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        // Draw line
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Emit to socket (naive: optimize with throttling in prod)
        // We actually need prev coordinates to draw a line segment
        // For simplicity, we might just emit point, but line segments are better.
        // Let's implement a better approach for remote drawing:
    };

    // Better drawing handler
    const lastPos = useRef({ x: 0, y: 0 });

    const onMouseDown = (e) => {
        setIsDrawing(true);
        const { x, y } = getPos(e);
        lastPos.current = { x, y };
    };

    const onMouseMove = (e) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);

        const drawColor = tool === "eraser" ? "#1a1a2e" : color;

        drawOnCanvas(lastPos.current.x, lastPos.current.y, x, y, drawColor, lineWidth);

        // Emit
        if (socket) {
            socket.emit("whiteboard-change", roomId, {
                type: "draw",
                x0: lastPos.current.x,
                y0: lastPos.current.y,
                x1: x,
                y1: y,
                color: drawColor,
                width: lineWidth
            });
        }

        lastPos.current = { x, y };
    };

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const drawOnCanvas = (x0, y0, x1, y1, strokeColor, strokeWidth) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe
        // If we want a background color
        // ctx.fillStyle = "#1a1a2e";
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleClear = () => {
        clearCanvas();
        if (socket) {
            socket.emit("whiteboard-change", roomId, { type: "clear" });
        }
    };

    return (
        <div className="flex flex-col h-full bg-dark-200 relative">
            <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={onMouseMove}
                onTouchStart={onMouseDown}
                onTouchEnd={stopDrawing}
                onTouchMove={onMouseMove}
                className="flex-1 touch-none cursor-crosshair bg-[#1a1a2e]"
            />

            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-dark-100 border border-dark-400 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
                <button
                    onClick={() => setTool("pen")}
                    className={`p-2 rounded-full transition-colors ${tool === "pen" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"}`}
                >
                    <Pen className="w-4 h-4" />
                </button>

                <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                        setColor(e.target.value);
                        setTool("pen");
                    }}
                    className="w-6 h-6 rounded-full border-none cursor-pointer bg-transparent"
                />

                <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseInt(e.target.value))}
                    className="w-20"
                />

                <button
                    onClick={() => setTool("eraser")}
                    className={`p-2 rounded-full transition-colors ${tool === "eraser" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"}`}
                >
                    <Eraser className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-dark-400"></div>

                <button
                    onClick={handleClear}
                    className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
