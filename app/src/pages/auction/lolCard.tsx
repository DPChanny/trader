import { Section } from "@/components/section";
import { Badge } from "@/components/badge";
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
        <div className={styles.accountInfo}>
          <Badge variantColor={getTierColor(lolInfo.tier)}>
            {lolInfo.tier !== "Unranked"
              ? `${lolInfo.tier} ${lolInfo.rank} ${lolInfo.lp}LP`
              : "Unranked"}
          </Badge>
        </div>
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
                  <Badge variantColor="blue">{`${champion.games}게임`}</Badge>
                  <Badge variantColor="green">
                    {`${champion.winRate.toFixed(1)}%`}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function getTierColor(tier: string): "blue" | "green" | "red" | "gray" {
  const lowerTier = tier.toLowerCase();
  if (
    lowerTier.includes("iron") ||
    lowerTier.includes("bronze") ||
    lowerTier.includes("silver")
  )
    return "gray";
  if (lowerTier.includes("gold") || lowerTier.includes("platinum"))
    return "blue";
  if (
    lowerTier.includes("diamond") ||
    lowerTier.includes("emerald") ||
    lowerTier.includes("ascendant")
  )
    return "green";
  if (
    lowerTier.includes("master") ||
    lowerTier.includes("grandmaster") ||
    lowerTier.includes("challenger") ||
    lowerTier.includes("immortal") ||
    lowerTier.includes("radiant")
  )
    return "red";
  return "gray";
}
