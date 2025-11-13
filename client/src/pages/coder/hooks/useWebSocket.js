import { useEffect, useRef } from "react";
import CONFIG from "../config";

export default function useWebSocket(sessionId, handlers) {
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWs = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found");
        return;
      }

      wsRef.current = new WebSocket(
        `${CONFIG.WEBSOCKET_URL}/${sessionId}/message/${token}`
      );

      wsRef.current.onopen = handlers.onOpen;
      wsRef.current.onmessage = handlers.onMessage;
      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected. Attempting to reconnect in 3s...");
        handlers.onClose();
        setTimeout(connectWs, 3000);
      };
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        handlers.onError(error);
        wsRef.current.close();
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      handlers.onCleanup?.();
    };
  }, [sessionId]);

  return wsRef;
}
