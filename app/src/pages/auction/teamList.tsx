import { TeamCard } from "./teamCard";
import type { Team } from "@/types";
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
          team.member_id_list.includes(member.user_id)
        );

        return (
          <TeamCard
            key={team.team_id}
            team={team}
            members={members}
            pointScale={pointScale}
          />
        );
      })}
    </Section>
  );
}
