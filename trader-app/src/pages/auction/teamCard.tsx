import { UserGrid } from "@/components/userGrid";
import type { Team } from "@/types";
import "./teamCard.css";

interface TeamMember {
  user_id: number;
  nickname: string;
  riot_nickname: string;
  tier: string | null;
  positions: string[];
  is_leader: boolean;
}

interface TeamCardProps {
  team: Team;
  members: TeamMember[];
  isMyTeam?: boolean;
  leaderName?: string;
}

export function TeamCard({
  team,
  members,
  isMyTeam = false,
  leaderName,
}: TeamCardProps) {
  // UserGrid용 데이터 변환
  const gridUsers = members.map((member) => ({
    id: member.user_id,
    nickname: member.nickname,
    riot_nickname: member.riot_nickname,
    tier: member.tier,
    positions: member.positions,
    is_leader: member.is_leader,
  }));

  const teamName = leaderName ? `${leaderName} 팀` : `Team ${team.team_id}`;

  return (
    <div className={`team-card ${isMyTeam ? "my-team" : ""}`}>
      <div className="team-card-header">
        <h4>{teamName}</h4>
        <div className="team-info">
          <span className="team-points">{team.points} 포인트</span>
          <span className="team-members-count">{members.length}명</span>
        </div>
      </div>
      <div className="team-members-grid">
        <UserGrid title="" users={gridUsers} onUserClick={() => {}} />
      </div>
    </div>
  );
}
