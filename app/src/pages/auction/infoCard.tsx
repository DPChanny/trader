import { Section } from "@/components/section";
import styles from "@/styles/pages/auction/infoCard.module.css";

interface InfoCardProps {
  label: string;
  value: string | number;
  variant?: "time" | "bid" | "default";
  children?: any;
}

export function InfoCard({
  label,
  value,
  variant = "default",
  children,
}: InfoCardProps) {
  return (
    <Section variantType="secondary" className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <Section variantTone="ghost" className={styles.valueSection}>
        {children ? (
          children
        ) : (
          <span
            className={`${styles.infoValue} ${
              variant !== "default" ? styles[variant] : ""
            }`}
          >
            {value}
          </span>
        )}
      </Section>
    </Section>
  );
}
