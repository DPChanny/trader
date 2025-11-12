export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface Auction {
  auction_id: string;
  preset_id: number;
}

export type MessageType =
  | "timer"
  | "place_bid"
  | "bid_placed"
  | "user_sold"
  | "user_unsold"
  | "next_user"
  | "queue_update"
  | "init"
  | "status"
  | "error";

export interface WebSocketMessage {
  type: MessageType;
  data: any;
}

export interface AuctionInitData {
  auction_id: string;
  preset_id: number;
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

export interface BidResponseData {
  team_id: number;
  leader_id: number;
  amount: number;
}

export interface NextUserData {
  user_id: number;
}

export interface QueueUpdateData {
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

export interface Preset {
  preset_id: number;
  name: string;
  points: number;
  time: number;
  point_scale: number;
}

export interface PresetUser {
  preset_user_id: number;
  preset_id: number;
  user_id: number;
  tier_id: number | null;
  is_leader: boolean;
  user: {
    user_id: number;
    name: string;
    riot_id: string;
    profile_url?: string | null;
  };
  tier: {
    tier_id: number;
    name: string;
  } | null;
  positions: {
    preset_user_position_id: number;
    preset_user_id: number;
    position_id: number;
    position: {
      position_id: number;
      preset_id: number;
      name: string;
      icon_url?: string | null;
    };
  }[];
}

export interface Tier {
  tier_id: number;
  preset_id: number;
  name: string;
}

export interface PresetDetail {
  preset_id: number;
  name: string;
  points: number;
  time: number;
  point_scale: number;
  preset_users: PresetUser[];
  tiers: Tier[];
  positions: {
    position_id: number;
    preset_id: number;
    name: string;
    icon_url?: string | null;
  }[];
}

import type { Team } from "./types";
export type { Team };
