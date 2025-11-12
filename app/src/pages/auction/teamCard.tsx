import { UserGrid } from "@/components/userGrid";
import type { Team } from "@/dtos";
import type { UserCardProps } from "@/components/userCard";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: UserCardProps[];
  pointScale: number;
}

export function TeamCard({ team, members, pointScale }: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader ? `${leader.name} 팀` : `Team ${team.teamId}`;

  return (
    <Section variantType="secondary" className={styles.teamCard}>
      <Section variantTone="ghost" variantLayout="row">
        <h4>{teamName}</h4>
        <span className={styles.points}>{team.points * pointScale} 포인트</span>
      </Section>
      <Bar />
      <Section variantTone="ghost" className={styles.membersGrid}>
        <UserGrid users={members} onUserClick={() => {}} variant="compact" />
      </Section>
    </Section>
  );
}
