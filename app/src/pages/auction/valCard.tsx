import { Section } from "@/components/section";
import { Badge } from "@/components/badge";
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
        <div className={styles.accountInfo}>
          <Badge variantColor={getTierColor(valInfo.tier)}>
            {valInfo.tier !== "Unranked"
              ? `${valInfo.tier} ${valInfo.rank} ${valInfo.rr}RR`
              : "Unranked"}
          </Badge>
        </div>
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
                  <Badge variantColor="blue">{`${agent.games}게임`}</Badge>
                  <Badge variantColor="green">
                    {`${agent.winRate.toFixed(1)}%`}
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
