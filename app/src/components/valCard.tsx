import { Section } from "@/components/section";
import { Toggle } from "@/components/toggle";
import type { ValDto } from "@/dtos";
import styles from "@/styles/components/valCard.module.css";

interface ValCardProps {
  valInfo: ValDto | null;
}

export function ValCard({ valInfo }: ValCardProps) {
  return (
    <Section variantType="secondary">
      <Section variantTone="ghost" variantType="secondary">
        <h4 className={styles.gameTitle}>VALORANT</h4>
        <Toggle color={"blue"} active={true} onClick={() => {}}>
          {valInfo && valInfo.tier !== "Unranked"
            ? `${valInfo.tier} ${valInfo.rank}`.trim()
            : "Unranked"}
        </Toggle>
      </Section>
      {valInfo && valInfo.topAgents && valInfo.topAgents.length > 0 && (
        <Section variantTone="ghost" variantType="secondary">
          {valInfo.topAgents.map((agent, index) => (
            <Section key={index} variantType="tertiary">
              <Section
                variantTone="ghost"
                variantType="primary"
                variantLayout="row"
                className={styles.agentSection}
              >
                <img
                  src={agent.iconUrl}
                  alt={agent.name}
                  className={styles.agentIcon}
                />
                <Section
                  variantTone="ghost"
                  variantType="tertiary"
                  className={styles.infoSection}
                >
                  <span className={styles.agentName}>{agent.name}</span>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantType="tertiary"
                  >
                    <Toggle
                      color="gold"
                      active={true}
                      onClick={() => {}}
                    >{`${agent.games} 게임`}</Toggle>
                    <Toggle color="red" active={true} onClick={() => {}}>
                      {`승률 ${agent.winRate.toFixed(1)}%`}
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
