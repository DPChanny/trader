import { Loading } from "@/components/loading";
import { EditButton, DeleteButton } from "@/components/button";

import styles from "@/styles/pages/preset/presetList.module.css";

interface PresetListProps {
  presets: any[];
  selectedPresetId: number | null;
  onSelectPreset: (presetId: number) => void;
  onEditPreset: (presetId: number) => void;
  onDeletePreset: (presetId: number) => void;
  isLoading: boolean;
}

export function PresetList({
  presets,
  selectedPresetId,
  onSelectPreset,
  onEditPreset,
  onDeletePreset,
  isLoading,
}: PresetListProps) {
  return (
    <div className={styles.section}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      ) : (
        <div className={styles.list}>
          {presets?.map((preset) => (
            <div
              key={preset.preset_id}
              className={`${styles.item} ${
                selectedPresetId === preset.preset_id ? styles.selected : ""
              }`}
            >
              <div
                className={styles.itemContent}
                onClick={() => onSelectPreset(preset.preset_id)}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{preset.name}</span>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemDetail}>
                      포인트: {preset.points}
                    </span>
                    <span className={styles.itemDetail}>
                      타이머: {preset.time}초
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={styles.itemActions}
                onClick={(e) => e.stopPropagation()}
              >
                <EditButton
                  variantSize="sm"
                  onClick={() => onEditPreset(preset.preset_id)}
                />
                <DeleteButton
                  variantSize="sm"
                  onClick={() => onDeletePreset(preset.preset_id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
