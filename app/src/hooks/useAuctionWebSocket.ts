import { useEffect, useRef, useState } from "preact/hooks";
import type {
  WebSocketMessage,
  AuctionInitData,
  BidResponseData,
  NextUserData,
  TimerData,
  UserSoldData,
} from "@/dtos";

const WS_URL = "ws://localhost:8000";

interface AuctionWebSocketHook {
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  placeBid: (amount: number) => void;
  state: AuctionInitData | null;
  role: "leader" | "observer" | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<AuctionInitData | null>(null);
  const [role, setRole] = useState<"leader" | "observer" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const accessCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log("Processing WebSocket message:", message);

    switch (message.type) {
      case "init": {
        const data = message.data as AuctionInitData;
        setRole(data.role);

        setState(data);
        break;
      }

      case "next_user": {
        const data = message.data as NextUserData;
        setState((prev) =>
          prev
            ? {
                ...prev,
                current_user_id: data.user_id,
                current_bid: null,
                current_bidder: null,
                auction_queue: data.auction_queue,
                unsold_queue: data.unsold_queue,
              }
            : null
        );
        break;
      }

      case "timer": {
        const data = message.data as TimerData;
        setState((prev) => (prev ? { ...prev, timer: data.timer } : null));
        break;
      }

      case "bid_placed": {
        const data = message.data as BidResponseData;
        setState((prev) =>
          prev
            ? {
                ...prev,
                current_bid: data.amount,
                current_bidder: data.team_id,
              }
            : null
        );
        break;
      }

      case "user_sold": {
        const data = message.data as UserSoldData;
        setState((prev) =>
          prev
            ? {
                ...prev,
                teams: data.teams,
              }
            : null
        );
        break;
      }

      case "user_unsold": {
        break;
      }

      case "status": {
        const data = message.data as {
          status: "waiting" | "in_progress" | "completed";
        };
        setState((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
              }
            : null
        );
        break;
      }

      case "error":
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      sessionIdRef.current = null;
      accessCodeRef.current = null;
      setIsConnected(false);
      setState(null);
    }
  };

  const connect = (token: string) => {
    disconnect();

    const url = `${WS_URL}/api/auction/ws/${token}`;

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
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log("WebSocket message received:", message);
        if (mountedRef.current) {
          handleWebSocketMessage(message);
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

  const placeBid = (amount: number) => {
    if (!wsRef.current) {
      console.error("Cannot place bid: not connected");
      return;
    }

    const message = {
      type: "place_bid",
      data: {
        amount: amount,
      },
    };

    wsRef.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    placeBid,
    state,
    role,
  };
}
