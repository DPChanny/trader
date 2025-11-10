import { useEffect, useRef, useState } from "preact/hooks";
import type {
  WebSocketMessage,
  AuctionDetailDTO,
  BidPlacedData,
  NextUserData,
  TimerData,
  UserSoldData,
} from "@/types";

const WS_URL = "ws://localhost:8000";

interface AuctionWebSocketHook {
  isConnected: boolean;
  joinAsObserver: (sessionId: string) => void;
  joinAsLeader: (sessionId: string, accessCode: string) => void;
  disconnect: () => void;
  placeBid: (amount: number) => void;
  lastMessage: any;
  auctionState: AuctionDetailDTO | null;
  isLeader: boolean;
  myTeamId: number | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [auctionState, setAuctionState] = useState<AuctionDetailDTO | null>(
    null
  );
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const accessCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log("Processing WebSocket message:", message);

    switch (message.type) {
      case "get_state":
        // 전체 상태 업데이트
        setAuctionState(message.data as AuctionDetailDTO);
        break;

      case "auction_started": {
        break;
      }

      case "next_user": {
        // 다음 유저로 이동
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
                timer: prev.timer, // 타이머는 timer_tick에서 업데이트
              }
            : null
        );
        break;
      }

      case "timer_tick": {
        // 타이머 틱
        const data = message.data as TimerData;
        setAuctionState((prev) =>
          prev ? { ...prev, timer: data.timer } : null
        );
        break;
      }

      case "bid_placed": {
        // 입찰 발생
        const data = message.data as BidPlacedData;
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
        // 낙찰 - 팀 정보 전체 업데이트
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

      case "auction_completed": {
        break;
      }

      case "session_terminated": {
        // 세션 종료 - 연결 해제
        console.log("Session terminated:", message.data);
        disconnect();
        break;
      }

      case "leader_connected": {
        // 리더 연결 성공 - 팀 ID 저장
        const data = message.data as { team_id: number; access_code: string };
        setMyTeamId(data.team_id);
        console.log("Leader connected, team_id:", data.team_id);
        break;
      }

      case "error":
        // 이러한 메시지는 lastMessage로만 전달
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
      setMyTeamId(null);
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

  const joinAsObserver = (sessionId: string) => {
    sessionIdRef.current = sessionId;
    accessCodeRef.current = null;
    connect(`${WS_URL}/api/auction/ws/${sessionId}/observer`);
  };

  const joinAsLeader = (sessionId: string, accessCode: string) => {
    sessionIdRef.current = sessionId;
    accessCodeRef.current = accessCode;
    connect(`${WS_URL}/api/auction/ws/${sessionId}/leader/${accessCode}`);
  };

  const placeBid = (amount: number) => {
    if (!wsRef.current || !accessCodeRef.current) {
      console.error("Cannot place bid: not connected as leader");
      return;
    }

    const message = {
      type: "place_bid",
      data: {
        access_code: accessCodeRef.current,
        amount: amount,
      },
    };

    wsRef.current.send(JSON.stringify(message));
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
    placeBid,
    lastMessage,
    auctionState,
    isLeader: accessCodeRef.current !== null,
    myTeamId,
  };
}
