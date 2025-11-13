import { useState } from "preact/hooks";
import { Loading } from "@/components/loading";
import { PresetCard } from "./presetCard";
import type { Preset } from "@/dtos";
import styles from "@/styles/pages/preset/presetList.module.css";
import { Section } from "@/components/section";
import { useDeletePreset, useUpdatePreset } from "@/hooks/usePresetApi";
import { ConfirmModal } from "@/components/modal";
import { EditPresetModal } from "./editPresetModal";

interface PresetListProps {
  presets: Preset[];
  selectedPresetId: number | null;
  onSelectPreset: (presetId: number) => void;
  isLoading: boolean;
  onPresetDeleted?: (presetId: number) => void;
}

export function PresetList({
  presets,
  selectedPresetId,
  onSelectPreset,
  isLoading,
  onPresetDeleted,
}: PresetListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<number | null>(null);

  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleEdit = (presetId: number) => {
    setEditingPresetId(presetId);
    setIsEditing(true);
  };

  const handleUpdate = async (
    name: string,
    points: number,
    time: number,
    pointScale: number
  ) => {
    if (!editingPresetId || !name.trim()) return;
    try {
      await updatePreset.mutateAsync({
        presetId: editingPresetId,
        name: name.trim(),
        points,
        time,
        point_scale: pointScale,
      });
      setIsEditing(false);
      setEditingPresetId(null);
    } catch (err) {
      console.error("Failed to update preset:", err);
    }
  };

  const handleDeleteClick = (presetId: number) => {
    setDeletingPresetId(presetId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingPresetId) return;
    try {
      await deletePreset.mutateAsync(deletingPresetId);
      setShowDeleteConfirm(false);
      onPresetDeleted?.(deletingPresetId);
      setDeletingPresetId(null);
    } catch (err) {
      console.error("Failed to delete preset:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Section variantTone="ghost" className={styles.contentSection}>
      {isLoading ? (
        <Loading />
      ) : (
        <Section variantTone="ghost">
          {presets?.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              isSelected={selectedPresetId === preset.presetId}
              onSelect={onSelectPreset}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </Section>
      )}

      <EditPresetModal
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingPresetId(null);
        }}
        onSubmit={handleUpdate}
        presetId={editingPresetId}
        name={presets.find((p) => p.presetId === editingPresetId)?.name || ""}
        points={
          presets.find((p) => p.presetId === editingPresetId)?.points || 1000
        }
        time={presets.find((p) => p.presetId === editingPresetId)?.time || 30}
        pointScale={
          presets.find((p) => p.presetId === editingPresetId)?.pointScale || 1
        }
        isPending={updatePreset.isPending}
        error={updatePreset.error}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingPresetId(null);
        }}
        onConfirm={handleDelete}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePreset.isPending}
      />
    </Section>
  );
}
