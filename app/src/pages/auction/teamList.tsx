import { TeamCard } from "./teamCard";
import type { Team } from "@/types";
import type { UserCardProps } from "@/components/userCard";
import styles from "@/styles/pages/auction/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  users: UserCardProps[];
}

export function TeamList({ teams, users }: TeamListProps) {
  return (
    <div className={styles.teamList}>
      {teams.map((team) => {
        const members = users.filter((member) =>
          team.member_id_list.includes(member.user_id)
        );

        return (
          <div key={team.team_id} className={styles.teamListItem}>
            <TeamCard team={team} members={members} />
          </div>
        );
      })}
    </div>
  );
}
