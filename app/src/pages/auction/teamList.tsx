import { TeamCard } from "./teamCard";
import type { Team } from "@/types";
import styles from "@/styles/pages/auction/teamList.module.css";

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
}

export function TeamList({ teams, allMembers }: TeamListProps) {
  return (
    <div className={styles.teamList}>
      {teams.map((team) => {
        // 각 팀의 멤버 필터링
        const teamMembers = allMembers.filter((member) =>
          team.member_id_list.includes(member.user_id)
        );

        // 리더 찾기
        const leader = teamMembers.find((member) => member.is_leader);
        const leaderName = leader?.nickname;

        return (
          <div key={team.team_id} className={styles.teamListItem}>
            <TeamCard
              team={team}
              members={teamMembers}
              leaderName={leaderName}
            />
          </div>
        );
      })}
    </div>
  );
}
