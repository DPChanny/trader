import { UserGrid } from "@/components/userGrid";
import type { Team } from "@/types";
import styles from "@/styles/pages/auction/teamCard.module.css";

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
    <div className={`${styles.teamCard} ${isMyTeam ? styles.myTeam : ""}`}>
      <div className={styles.header}>
        <h4 className="font-bold text-lg text-blue-700">{teamName}</h4>
        <div className={styles.info}>
          <span className={styles.points}>{team.points} 포인트</span>
          <span className={styles.count}>{members.length}명</span>
        </div>
      </div>
      <div className={styles.membersGrid}>
        <UserGrid title="" users={gridUsers} onUserClick={() => {}} />
      </div>
    </div>
  );
}
