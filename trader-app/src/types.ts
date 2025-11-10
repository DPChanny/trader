export interface User {
  user_id: number;
  nickname: string;
  riot_nickname: string;
  access_code?: string;
  position?: string;
  tier?: string;
}

export interface Position {
  position_id: number;
  auction_preset_user_id: number;
  name: string;
}

export interface UserDetail extends User {
  positions: Position[];
}

// Auction Types
export interface AuctionDTO {
  session_id: string;
  preset_id: number;
  status: "waiting" | "in_progress" | "completed";
}

export interface Team {
  team_id: number;
  leader_id: number;
  member_id_list: number[];
  points: number;
}

export interface AuctionDetailDTO {
  session_id: string;
  status: "waiting" | "in_progress" | "completed";
  current_user_id: number | null;
  current_bid: number | null;
  current_bidder: number | null;
  timer: number;
  teams: Team[];
  auction_queue: number[];
  unsold_queue: number[];
}

// WebSocket Message Types
export type MessageType =
  | "auction_started"
  | "timer_tick"
  | "bid_placed"
  | "user_sold"
  | "user_unsold"
  | "next_user"
  | "auction_completed"
  | "session_terminated"
  | "leader_connected"
  | "error"
  | "get_state";

export interface WebSocketMessage {
  type: MessageType;
  data: any;
}

export interface BidPlacedData {
  team_id: number;
  leader_id: number;
  amount: number;
}

export interface NextUserData {
  user_id: number;
  auction_queue: number[];
  unsold_queue: number[];
}

export interface UserSoldData {
  user_id: number;
  team_id: number;
  amount: number;
  teams: Team[];
}

export interface TimerData {
  timer: number;
}
