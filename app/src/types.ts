export interface User {
  user_id: number;
  name: string;
  riot_id: string;
  discord_id: string;
}

export interface Member extends User {
  tier: string | null;
  positions: string[];
  is_leader: boolean;
}

export interface Team {
  team_id: number;
  leader_id: number;
  member_id_list: number[];
  points: number;
}

export interface UserItem {
  id: number | string;
  name: string;
  riot_id: string;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}
