import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { ValDto } from "@/dtos";
import styles from "@/styles/pages/auction/valCard.module.css";

interface ValCardProps {
  valInfo: ValDto;
}

export function ValCard({ valInfo }: ValCardProps) {
  if (!valInfo) {
    return null;
  }

  return (
    <Section variantType="secondary" className={styles.statsSection}>
      <div className={styles.header}>
        <h4 className={styles.gameTitle}>VALORANT</h4>
        <Toggle color={"blue"} active={true} onClick={() => {}}>
          {valInfo.tier !== "Unranked"
            ? `${valInfo.tier} ${valInfo.rank} ${valInfo.rr}RR`
            : "Unranked"}
        </Toggle>
      </div>

      {valInfo.topAgents && valInfo.topAgents.length > 0 && (
        <div className={styles.championsGrid}>
          {valInfo.topAgents.map((agent, index) => (
            <div key={index} className={styles.championCard}>
              <img
                src={agent.iconUrl}
                alt={agent.name}
                className={styles.championIcon}
              />
              <div className={styles.championInfo}>
                <span className={styles.championName}>{agent.name}</span>
                <div className={styles.championStats}>
                  <Toggle
                    color="gold"
                    active={true}
                    onClick={() => {}}
                  >{`${agent.games} 게임`}</Toggle>
                  <Toggle color="red" active={true} onClick={() => {}}>
                    {`승률 ${agent.winRate.toFixed(1)}%`}
                  </Toggle>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
