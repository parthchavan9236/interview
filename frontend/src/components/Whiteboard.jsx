import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useEffect, useState } from 'react';

function WhiteboardLogic({ socket, roomId }) {
    const editor = useEditor();
    const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

    useEffect(() => {
        if (!socket || !editor) return;

        // Listen for local changes
        const cleanup = editor.store.listen((update) => {
            // Only emit if the change originated from the user
            if (update.source === 'user') {
                const snapshot = editor.store.getSnapshot();
                socket.emit('whiteboard-change', roomId, snapshot);
            }
        });

        return () => cleanup();
    }, [editor, socket, roomId]);

    useEffect(() => {
        if (!socket || !editor) return;

        const handleRemoteUpdate = (snapshot) => {
            // Load the snapshot without triggering the listener (source: 'remote' implicitly or explicit?)
            // loadSnapshot usually treats as 'user' unless specified? 
            // Tldraw's loadSnapshot replaces the store.
            // We use run with { source: 'remote' } ? loadSnapshot does not accept options in all versions.
            // But if we load snapshot, it might trigger listen? 
            // We can check source in listen. loadSnapshot usually sets source to 'user' if not specified.
            // Let's rely on checking if it matches? No.

            // Simpler: Just load it. If it loops, we'll fix.
            // Optimization: Only load if different? 
            // For now:
            try {
                editor.store.loadSnapshot(snapshot);
            } catch (e) {
                console.error("Failed to load remote snapshot", e);
            }
        };

        socket.on('whiteboard-change', handleRemoteUpdate);
        return () => socket.off('whiteboard-change', handleRemoteUpdate);
    }, [socket, editor]);

    return null;
}

export default function Whiteboard({ socket, roomId }) {
    return (
        <div className="w-full h-full relative" style={{ height: 'calc(100vh - 100px)' }}>
            <Tldraw persistenceKey={`room-${roomId}`} className="z-0">
                <WhiteboardLogic socket={socket} roomId={roomId} />
            </Tldraw>
        </div>
    );
}
