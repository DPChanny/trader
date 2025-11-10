import { UserCard } from "@/components/userCard";
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
}

export function TeamCard({ team, members }: TeamCardProps) {
  // 리더를 앞에 배치하고 나머지는 순서대로
  const sortedMembers = [...members].sort((a, b) => {
    if (a.is_leader && !b.is_leader) return -1;
    if (!a.is_leader && b.is_leader) return 1;
    return 0;
  });

  return (
    <div className="team-card">
      <div className="team-card-header">
        <h4>Team {team.team_id}</h4>
        <div className="team-info">
          <span className="team-points">{team.points} 포인트</span>
          <span className="team-members-count">{members.length}명</span>
        </div>
      </div>
      <div className="team-members">
        {sortedMembers.map((member) => (
          <div key={member.user_id} className="team-member-item">
            <UserCard
              nickname={member.nickname}
              riot_nickname={member.riot_nickname}
              tier={member.tier}
              positions={member.positions}
              is_leader={member.is_leader}
            />
          </div>
        ))}
        {members.length === 0 && (
          <p className="empty-team">아직 팀원이 없습니다</p>
        )}
      </div>
    </div>
  );
}
