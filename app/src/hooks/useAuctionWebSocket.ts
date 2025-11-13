import {useEffect, useRef, useState} from "preact/hooks";
import type {
  AuctionInitData,
  BidResponseData,
  NextUserData,
  QueueUpdateData,
  TimerData,
  UserSoldData,
  WebSocketMessage,
} from "@/dtos";
import {AUCTION_WS_URL} from "@/config";
import {toCamelCase} from "@/lib/dtoMapper";

interface AuctionWebSocketHook {
  isConnected: boolean;
  wasConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  placeBid: (amount: number) => void;
  state: AuctionInitData | null;
  role: "leader" | "observer" | null;
  userId: number | null;
  teamId: number | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [state, setState] = useState<AuctionInitData | null>(null);
  const [role, setRole] = useState<"leader" | "observer" | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const accessCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "init": {
        const rawData = message.data;
        const data = toCamelCase<AuctionInitData>(rawData);
        setRole(data.role);
        setUserId(data.userId);
        setTeamId(data.teamId);

        setState(data);
        break;
      }

      case "next_user": {
        const data = toCamelCase<NextUserData>(message.data);
        setState((prev) =>
          prev
            ? {
              ...prev,
              currentUserId: data.userId,
              currentBid: null,
              currentBidder: null,
            }
            : null
        );
        break;
      }

      case "queue_update": {
        const data = toCamelCase<QueueUpdateData>(message.data);
        setState((prev) =>
          prev
            ? {
              ...prev,
              auctionQueue: data.auctionQueue,
              unsoldQueue: data.unsoldQueue,
            }
            : null
        );
        break;
      }

      case "timer": {
        const data = toCamelCase<TimerData>(message.data);
        setState((prev) => (prev ? {...prev, timer: data.timer} : null));
        break;
      }

      case "bid_placed": {
        const data = toCamelCase<BidResponseData>(message.data);
        setState((prev) =>
          prev
            ? {
              ...prev,
              currentBid: data.amount,
              currentBidder: data.teamId,
            }
            : null
        );
        break;
      }

      case "user_sold": {
        const data = toCamelCase<UserSoldData>(message.data);
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
        break;
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

    const url = `${AUCTION_WS_URL}/${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (mountedRef.current) {
        setIsConnected(true);
        setWasConnected(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        if (mountedRef.current) {
          handleWebSocketMessage(message);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    wsRef.current = ws;
  };

  const placeBid = (amount: number) => {
    if (!wsRef.current) {
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
    wasConnected,
    connect,
    disconnect,
    placeBid,
    state,
    role,
    userId,
    teamId,
  };
}
