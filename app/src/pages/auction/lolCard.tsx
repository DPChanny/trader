import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { LolDto } from "@/dtos";
import styles from "@/styles/pages/auction/lolCard.module.css";

interface LolCardProps {
  lolInfo: LolDto;
}

export function LolCard({ lolInfo }: LolCardProps) {
  if (!lolInfo) {
    return null;
  }

  return (
    <Section variantType="secondary" className={styles.statsSection}>
      <div className={styles.header}>
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle color={"blue"} active={true} onClick={() => {}}>
          {lolInfo.tier !== "Unranked"
            ? `${lolInfo.tier} ${lolInfo.rank} ${lolInfo.lp}LP`
            : "Unranked"}
        </Toggle>
      </div>

      {lolInfo.topChampions && lolInfo.topChampions.length > 0 && (
        <div className={styles.championsGrid}>
          {lolInfo.topChampions.map((champion, index) => (
            <div key={index} className={styles.championCard}>
              <img
                src={champion.iconUrl}
                alt={champion.name}
                className={styles.championIcon}
              />
              <div className={styles.championInfo}>
                <span className={styles.championName}>{champion.name}</span>
                <div className={styles.championStats}>
                  <Toggle
                    color="gold"
                    active={true}
                    onClick={() => {}}
                  >{`${champion.games} 게임`}</Toggle>
                  <Toggle color="red" active={true} onClick={() => {}}>
                    {`승률 ${champion.winRate.toFixed(1)}%`}
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
