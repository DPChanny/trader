import { TeamCard } from "./teamCard";
import type { Team, Member } from "@/types";
import styles from "@/styles/pages/auction/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  allMembers: Member[];
}

export function TeamList({ teams, allMembers }: TeamListProps) {
  return (
    <div className={styles.teamList}>
      {teams.map((team) => {
        const teamMembers = allMembers.filter((member) =>
          team.member_id_list.includes(member.user_id)
        );

        const leader = teamMembers.find((member) => member.is_leader);
        const leaderName = leader?.name;

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
