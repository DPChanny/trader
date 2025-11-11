import { UserGrid } from "@/components/userGrid";
import { Bar } from "@/components/bar";
import type { Team, Member } from "@/types";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: Member[];
  leaderName?: string;
}

export function TeamCard({ team, members, leaderName }: TeamCardProps) {
  const gridUsers = members.map((member) => ({
    id: member.user_id,
    name: member.name,
    riot_id: member.riot_id,
    tier: member.tier,
    positions: member.positions,
    is_leader: member.is_leader,
  }));

  const teamName = leaderName ? `${leaderName} 팀` : `Team ${team.team_id}`;

  return (
    <div className={styles.teamCard}>
      <div className={styles.header}>
        <h4 className="text-white text-lg font-bold">{teamName}</h4>
        <div className={styles.info}>
          <span className={styles.points}>{team.points} 포인트</span>
        </div>
      </div>
      <Bar
        variantColor="blue"
        variantThickness="thin"
        className={styles.divider}
      />
      <div className={styles.membersGrid}>
        <UserGrid users={gridUsers} onUserClick={() => {}} />
      </div>
    </div>
  );
}
