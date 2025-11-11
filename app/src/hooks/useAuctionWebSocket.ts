import { useEffect, useRef, useState } from "preact/hooks";
import type {
  WebSocketMessage,
  AuctionInitDTO,
  BidResponseData,
  NextUserData,
  TimerData,
  UserSoldData,
} from "@/types";

const WS_URL = "ws://localhost:8000";

interface AuctionWebSocketHook {
  isConnected: boolean;
  connectWithToken: (token: string) => void;
  disconnect: () => void;
  placeBid: (amount: number) => void;
  lastMessage: any;
  auctionState: AuctionInitDTO | null;
  isLeader: boolean;
  userRole: "leader" | "observer" | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [auctionState, setAuctionState] = useState<AuctionInitDTO | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [userRole, setUserRole] = useState<"leader" | "observer" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const accessCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log("Processing WebSocket message:", message);

    switch (message.type) {
      case "init": {
        const data = message.data as AuctionInitDTO;
        setUserRole(data.role);
        setIsLeader(data.role === "leader");

        setAuctionState(data);
        break;
      }

      case "next_user": {
        const data = message.data as NextUserData;
        setAuctionState((prev) =>
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
        setAuctionState((prev) =>
          prev ? { ...prev, timer: data.timer } : null
        );
        break;
      }

      case "bid_response": {
        const data = message.data as BidResponseData;
        setAuctionState((prev) =>
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
        setAuctionState((prev) =>
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
        setAuctionState((prev) =>
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
      setAuctionState(null);
      setIsLeader(false);
    }
  };

  const connect = (url: string) => {
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
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log("WebSocket message received:", message);
        if (mountedRef.current) {
          setLastMessage(message);
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

  const connectWithToken = (token: string) => {
    connect(`${WS_URL}/api/auction/ws/${token}`);
  };

  const placeBid = (amount: number) => {
    if (!wsRef.current) {
      console.error("Cannot place bid: not connected");
      return;
    }

    const message = {
      type: "bid_request",
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
    connectWithToken,
    disconnect,
    placeBid,
    lastMessage,
    auctionState,
    isLeader,
    userRole,
  };
}
