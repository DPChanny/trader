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
