import { useState } from "preact/hooks";
import {
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
} from "../../hooks/usePresetApi";
import {
  PrimaryButton,
  SecondaryButton,
  EditButton,
  DeleteButton,
  CloseButton,
  SaveButton,
} from "../../components/button";
import { Input } from "../../components/input";

interface PresetListProps {
  presets: any[];
  selectedPresetId: number | null;
  onSelectPreset: (presetId: number) => void;
  isLoading: boolean;
}

export function PresetList({
  presets,
  selectedPresetId,
  onSelectPreset,
  isLoading,
}: PresetListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");

  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) return;
    await createPreset.mutateAsync(newPresetName.trim());
    setNewPresetName("");
    setIsCreating(false);
  };

  const handleUpdatePreset = async (presetId: number) => {
    if (!editingPresetName.trim()) return;
    await updatePreset.mutateAsync({
      presetId,
      name: editingPresetName.trim(),
    });
    setEditingPresetId(null);
    setEditingPresetName("");
  };

  const handleDeletePreset = async (presetId: number) => {
    if (!confirm("이 프리셋을 삭제하시겠습니까?")) return;
    await deletePreset.mutateAsync(presetId);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleCreatePreset();
  };

  return (
    <div className="preset-list-section">
      <div className="section-header">
        <h2>Presets</h2>
        <PrimaryButton onClick={() => setIsCreating(true)}>추가</PrimaryButton>
      </div>

      {isLoading ? (
        <div className="loading">로딩중...</div>
      ) : (
        <div className="preset-list">
          {presets?.map((preset) => (
            <div
              key={preset.preset_id}
              className={`preset-item ${
                selectedPresetId === preset.preset_id ? "selected" : ""
              }`}
              onClick={() => onSelectPreset(preset.preset_id)}
            >
              {editingPresetId === preset.preset_id ? (
                <div
                  className="preset-edit-form"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    type="text"
                    value={editingPresetName}
                    onChange={(value) => setEditingPresetName(value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleUpdatePreset(preset.preset_id)
                    }
                    className="input-small"
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
                  <span className="preset-name">{preset.name}</span>
                  <div
                    className="preset-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditButton
                      onClick={() => {
                        setEditingPresetId(preset.preset_id);
                        setEditingPresetName(preset.name);
                      }}
                    />
                    <DeleteButton
                      onClick={() => handleDeletePreset(preset.preset_id)}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <div className="modal-overlay" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>프리셋 추가</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>프리셋 이름</label>
                <Input
                  type="text"
                  value={newPresetName}
                  onChange={(value) => setNewPresetName(value)}
                />
              </div>
              <div className="modal-actions">
                <SecondaryButton onClick={() => setIsCreating(false)}>
                  취소
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={!newPresetName.trim()}>
                  추가
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
