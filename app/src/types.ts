export interface User {
  user_id: number;
  name: string;
  riot_id: string;
  discord_id: string;
  profile_url?: string | null;
}

export interface Team {
  team_id: number;
  leader_id: number;
  member_id_list: number[];
  points: number;
}
