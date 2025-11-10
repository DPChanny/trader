import { useEffect, useRef, useState } from "preact/hooks";

const WS_URL = "ws://localhost:8000";

interface AuctionWebSocketHook {
  isConnected: boolean;
  joinAsObserver: (sessionId: string) => void;
  joinAsLeader: (sessionId: string, accessCode: string) => void;
  disconnect: () => void;
  lastMessage: any;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      sessionIdRef.current = null;
      setIsConnected(false);
    }
  };

  const connect = (url: string) => {
    // 기존 연결이 있으면 종료
    disconnect();

    console.log("Connecting to WebSocket:", url);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected to:", url);
      if (mountedRef.current) {
        setIsConnected(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);
        if (mountedRef.current) {
          setLastMessage(message);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log(
        "WebSocket disconnected. Code:",
        event.code,
        "Reason:",
        event.reason
      );
      if (mountedRef.current) {
        setIsConnected(false);
      }
    };

    wsRef.current = ws;
  };

  const joinAsObserver = (sessionId: string) => {
    sessionIdRef.current = sessionId;
    connect(`${WS_URL}/api/auction/ws/${sessionId}/observer`);
  };

  const joinAsLeader = (sessionId: string, accessCode: string) => {
    sessionIdRef.current = sessionId;
    connect(`${WS_URL}/api/auction/ws/${sessionId}/leader/${accessCode}`);
  };

  // 컴포넌트 언마운트 시에만 연결 해제
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);

  return {
    isConnected,
    joinAsObserver,
    joinAsLeader,
    disconnect,
    lastMessage,
  };
}
