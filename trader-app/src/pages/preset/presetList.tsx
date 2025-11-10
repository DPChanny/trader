import { useState } from "preact/hooks";
import { useUpdatePreset, useDeletePreset } from "@/hooks/usePresetApi";
import {
  EditButton,
  DeleteButton,
  CloseButton,
  SaveButton,
} from "@/components/button";
import { Input } from "@/components/input";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { ConfirmModal } from "@/components/confirmModal";
import styles from "@/styles/pages/preset/presetList.module.css";

interface PresetListProps {
  presets: any[];
  selectedPresetId: number | null;
  onSelectPreset: (presetId: number) => void;
  isLoading: boolean;
  onCreatePreset?: () => void;
}

export function PresetList({
  presets,
  selectedPresetId,
  onSelectPreset,
  isLoading,
}: PresetListProps) {
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleUpdatePreset = async (presetId: number) => {
    if (!editingPresetName.trim()) return;
    try {
      await updatePreset.mutateAsync({
        presetId,
        name: editingPresetName.trim(),
      });
      setEditingPresetId(null);
      setEditingPresetName("");
    } catch (err) {
      console.error("Failed to update preset:", err);
    }
  };

  const handleDeletePreset = async () => {
    if (deleteTargetId === null) return;
    try {
      await deletePreset.mutateAsync(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete preset:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={styles.section}>
      {updatePreset.isError && <Error>프리셋 이름 수정에 실패했습니다.</Error>}
      {deletePreset.isError && <Error>프리셋 삭제에 실패했습니다.</Error>}
      {isLoading ? (
        <Loading />
      ) : (
        <div className={styles.list}>
          {presets?.map((preset) => (
            <div
              key={preset.preset_id}
              className={`${styles.item} ${
                selectedPresetId === preset.preset_id ? styles.selected : ""
              }`}
              onClick={() => onSelectPreset(preset.preset_id)}
            >
              {editingPresetId === preset.preset_id ? (
                <div
                  className={styles.editForm}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    type="text"
                    value={editingPresetName}
                    onChange={(value) => setEditingPresetName(value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleUpdatePreset(preset.preset_id)
                    }
                    variantSize="sm"
                    autoFocus
                  />
                  <SaveButton
                    onClick={() => handleUpdatePreset(preset.preset_id)}
                    disabled={
                      editingPresetName.trim() === preset.name ||
                      !editingPresetName.trim()
                    }
                  />
                  <CloseButton
                    onClick={() => {
                      setEditingPresetId(null);
                      setEditingPresetName("");
                    }}
                  />
                </div>
              ) : (
                <>
                  <span className="font-semibold text-blue-700">
                    {preset.name}
                  </span>
                  <div
                    className="flex gap-2 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditButton
                      onClick={() => {
                        setEditingPresetId(preset.preset_id);
                        setEditingPresetName(preset.name);
                      }}
                    />
                    <DeleteButton
                      onClick={() => {
                        setDeleteTargetId(preset.preset_id);
                        setShowDeleteConfirm(true);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeletePreset}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
      />
    </div>
  );
}
