import {DeleteButton, EditButton} from "@/components/button";
import type {Preset} from "@/dtos";
import {Section} from "@/components/section";
import styles from "@/styles/pages/preset/presetCard.module.css";

interface PresetCardProps {
  preset: Preset;
  isSelected: boolean;
  onSelect: (presetId: number) => void;
  onEdit: (presetId: number) => void;
  onDelete: (presetId: number) => void;
}

export function PresetCard({
                             preset,
                             isSelected,
                             onSelect,
                             onEdit,
                             onDelete,
                           }: PresetCardProps) {
  const handleStopPropagation = (e: Event) => {
    e.stopPropagation();
  };

  return (
    <Section
      variantType="tertiary"
      variantLayout="row"
      className={`${styles.card} ${isSelected ? styles["card--selected"] : ""}`}
    >
      <div className={styles.cardContent} onClick={() => onSelect(preset.presetId)}>
        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{preset.name}</span>
          <div className={styles.cardDetails}>
            <span className={styles.cardDetail}>
              포인트: {preset.points * preset.pointScale}
            </span>
            <span className={styles.cardDetail}>타이머: {preset.time}초</span>
          </div>
        </div>
      </div>
      <div className={styles.cardActions} onClick={handleStopPropagation}>
        <EditButton variantSize="sm" onClick={() => onEdit(preset.presetId)}/>
        <DeleteButton variantSize="sm" onClick={() => onDelete(preset.presetId)}/>
      </div>
    </Section>
  );
}
