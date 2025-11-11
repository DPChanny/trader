export interface User {
  user_id: number;
  name: string;
  riot_id: string;
  discord_id: string;
}

export interface Position {
  position_id: number;
  auction_preset_user_id: number;
  name: string;
}

export interface UserDetail extends User {
  positions: Position[];
}

export interface AuctionDTO {
  auction_id: string;
  preset_id: number;
  status: "waiting" | "in_progress" | "completed";
}

export interface Team {
  team_id: number;
  leader_id: number;
  member_id_list: number[];
  points: number;
}

export interface AuctionInitDTO {
  auction_id: string;
  status: "waiting" | "in_progress" | "completed";
  current_user_id: number | null;
  current_bid: number | null;
  current_bidder: number | null;
  timer: number;
  teams: Team[];
  auction_queue: number[];
  unsold_queue: number[];
  team_id: number | null;
  user_id: number;
  role: "leader" | "observer";
}

// WebSocket Message Types
export type MessageType =
  | "timer"
  | "bid_request"
  | "bid_response"
  | "user_sold"
  | "user_unsold"
  | "next_user"
  | "init"
  | "status"
  | "error";

export interface WebSocketMessage {
  type: MessageType;
  data: any;
}

export interface BidResponseData {
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
