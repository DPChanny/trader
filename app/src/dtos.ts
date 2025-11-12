export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface Auction {
  auctionId: string;
  presetId: number;
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
  auctionId: string;
  presetId: number;
  status: "waiting" | "in_progress" | "completed";
  currentUserId: number | null;
  currentBid: number | null;
  currentBidder: number | null;
  timer: number;
  teams: Team[];
  auctionQueue: number[];
  unsoldQueue: number[];
  teamId: number | null;
  userId: number;
  role: "leader" | "observer";
}

export interface BidResponseData {
  teamId: number;
  leaderId: number;
  amount: number;
}

export interface NextUserData {
  userId: number;
}

export interface QueueUpdateData {
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface UserSoldData {
  userId: number;
  teamId: number;
  amount: number;
  teams: Team[];
}

export interface TimerData {
  timer: number;
}

export interface Preset {
  presetId: number;
  name: string;
  points: number;
  time: number;
  pointScale: number;
}

export interface PresetDetail extends Preset {
  presetUsers: PresetUserDetail[];
  tiers: Tier[];
  positions: Position[];
}

export interface PresetUser {
  presetUserId: number;
  presetId: number;
  userId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetUserDetail extends PresetUser {
  user: User;
  tier: Tier | null;
  positions: PresetUserPosition[];
}

export interface User {
  userId: number;
  name: string;
  riotId: string;
  discordId: string;
  profileUrl?: string | null;
}

export interface Tier {
  tierId: number;
  presetId: number;
  name: string;
}

export interface Position {
  positionId: number;
  presetId: number;
  name: string;
  iconUrl?: string | null;
}

export interface PresetUserPosition {
  presetUserPositionId: number;
  presetUserId: number;
  positionId: number;
  position: Position;
}

export interface Team {
  teamId: number;
  leaderId: number;
  memberIdList: number[];
  points: number;
}
