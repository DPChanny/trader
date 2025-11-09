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

export interface Team {
  team_id?: number;
  teamName: string;
  captain: User;
  requiredPositions: string[];
  initialPoints: number;
  users: (User | null)[];
  points: number;
}
