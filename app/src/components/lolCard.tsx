import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { LolDto } from "@/dtos";
import styles from "@/styles/components/lolCard.module.css";

interface LolCardProps {
  lolInfo: LolDto | null;
}

export function LolCard({ lolInfo }: LolCardProps) {
  return (
    <Section variantType="secondary">
      <Section variantTone="ghost" variantType="secondary">
        <h4 className={styles.gameTitle}>League of Legends</h4>
        <Toggle color={"blue"} active={true} onClick={() => {}}>
          {lolInfo && lolInfo.tier !== "Unranked"
            ? `${lolInfo.tier} ${lolInfo.rank} ${lolInfo.lp}LP`
            : "Unranked"}
        </Toggle>
      </Section>
      {lolInfo && lolInfo.topChampions && lolInfo.topChampions.length > 0 && (
        <Section variantTone="ghost" variantType="secondary">
          {lolInfo.topChampions.map((champion, index) => (
            <Section key={index} variantType="tertiary">
              <Section
                variantTone="ghost"
                variantType="primary"
                variantLayout="row"
                className={styles.championSection}
              >
                <img
                  src={champion.iconUrl}
                  alt={champion.name}
                  className={styles.championIcon}
                />
                <Section
                  variantTone="ghost"
                  variantType="tertiary"
                  className={styles.infoSection}
                >
                  <span className={styles.championName}>{champion.name}</span>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantType="tertiary"
                  >
                    <Toggle
                      color="gold"
                      active={true}
                      onClick={() => {}}
                    >{`${champion.games} 게임`}</Toggle>
                    <Toggle color="red" active={true} onClick={() => {}}>
                      {`승률 ${champion.winRate.toFixed(1)}%`}
                    </Toggle>
                  </Section>
                </Section>
              </Section>
            </Section>
          ))}
        </Section>
      )}
    </Section>
  );
}
