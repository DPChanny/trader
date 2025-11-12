import { Loading } from "@/components/loading";
import { PresetCard } from "./presetCard";
import type { Preset } from "@/dtos";

import styles from "@/styles/pages/preset/presetList.module.css";
import { Section } from "@/components/section";

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
    <Section variantTone="ghost" className={styles.contentSection}>
      {isLoading ? (
        <Loading />
      ) : (
        <Section variantTone="ghost">
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
        </Section>
      )}
    </Section>
  );
}
