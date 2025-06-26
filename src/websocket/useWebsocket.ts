import { useEffect, useRef, useState } from "react";

export function useWebSocket(roomId: string, onReceive?: (data: any) => void) {
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket(`ws://localhost:8080/${roomId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("open");
      console.log("[WebSocket] Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
        onReceive?.(data);
      } catch (error) {
        console.error("[WebSocket] Invalid JSON:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
    };

    socket.onclose = () => {
      setStatus("closed");
      console.warn("[WebSocket] Closed");
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const sendMessage = (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Tried to send before connection was open");
    }
  };

  return {
    sendMessage,
    messages,
    status,
  };
}
