import { TeamCard } from "./teamCard";
import type { Team } from "@/types";
import "./teamList.css";

interface TeamMember {
  user_id: number;
  nickname: string;
  riot_nickname: string;
  tier: string | null;
  positions: string[];
  is_leader: boolean;
}

interface TeamListProps {
  teams: Team[];
  allMembers: TeamMember[];
  myTeamId?: number | null;
}

export function TeamList({ teams, allMembers, myTeamId }: TeamListProps) {
  return (
    <div className="team-list">
      {teams.map((team) => {
        // 각 팀의 멤버 필터링
        const teamMembers = allMembers.filter((member) =>
          team.member_id_list.includes(member.user_id)
        );

        // 리더 찾기
        const leader = teamMembers.find((member) => member.is_leader);
        const leaderName = leader?.nickname;

        const isMyTeam = myTeamId !== null && myTeamId === team.team_id;

        return (
          <div key={team.team_id} className="team-list-item">
            <TeamCard
              team={team}
              members={teamMembers}
              isMyTeam={isMyTeam}
              leaderName={leaderName}
            />
          </div>
        );
      })}
    </div>
  );
}
