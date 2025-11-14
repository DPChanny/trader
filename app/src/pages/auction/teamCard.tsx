import { PresetUserGrid } from "@/components/presetUserGrid";
import type { PresetUserDetail, Team } from "@/dtos";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import { cn } from "@/lib/utils";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: PresetUserDetail[];
  pointScale: number;
}

export function TeamCard({ team, members, pointScale }: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader ? `${leader.user.name} 팀` : `Team ${team.teamId}`;
  const isFull = members.length === 5;

  return (
    <Section
      variantType="secondary"
      className={cn(styles.teamCard, isFull && styles["teamCard--full"])}
    >
      <Section variantTone="ghost" variantLayout="row">
        <h4>{teamName}</h4>
        <span className={styles.points}>{team.points * pointScale} 포인트</span>
      </Section>
      <Bar />
      <PresetUserGrid
        className={styles.membersGrid}
        presetUsers={members}
        onUserClick={() => {}}
        variant="compact"
      />
    </Section>
  );
}
