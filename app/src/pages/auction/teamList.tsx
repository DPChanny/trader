import { TeamCard } from "./teamCard";
import type { Team } from "@/dtos";
import type { UserCardProps } from "@/components/userCard";
import { Section } from "@/components/section";
import styles from "@/styles/pages/auction/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  users: UserCardProps[];
  pointScale: number;
}

export function TeamList({ teams, users, pointScale }: TeamListProps) {
  return (
    <Section variantTone="ghost" className={styles.teamList}>
      {teams.map((team) => {
        const members = users.filter((member) =>
          team.memberIdList.includes(member.userId)
        );

        return (
          <TeamCard
            key={team.teamId}
            team={team}
            members={members}
            pointScale={pointScale}
          />
        );
      })}
    </Section>
  );
}
