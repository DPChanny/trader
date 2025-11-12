import { UserGrid } from "@/components/userGrid";
import type { Team } from "@/types";
import type { UserCardProps } from "@/components/userCard";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: UserCardProps[];
  pointScale: number;
}

export function TeamCard({ team, members, pointScale }: TeamCardProps) {
  const leader = members.find((member) => member.is_leader);
  const teamName = leader ? `${leader.name} 팀` : `Team ${team.team_id}`;

  return (
    <div className={styles.teamCard}>
      <div className={styles.header}>
        <h4 className={styles.teamName}>{teamName}</h4>
        <div className={styles.info}>
          <span className={styles.points}>
            {team.points * pointScale} 포인트
          </span>
        </div>
      </div>
      <div className={styles.membersGrid}>
        <UserGrid users={members} onUserClick={() => {}} variant="compact" />
      </div>
    </div>
  );
}
