import { Loading } from "@/components/loading";
import { PresetCard } from "./presetCard";
import type { Preset } from "@/dtos";

import styles from "@/styles/pages/preset/presetList.module.css";

interface PresetListProps {
  presets: Preset[];
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
            <PresetCard
              key={preset.preset_id}
              preset={preset}
              isSelected={selectedPresetId === preset.preset_id}
              onSelect={onSelectPreset}
              onEdit={onEditPreset}
              onDelete={onDeletePreset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
