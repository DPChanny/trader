import { useState } from "preact/hooks";
import {
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
} from "../../hooks/useTierApi";
import {
  PrimaryButton,
  SecondaryButton,
  EditButton,
  DeleteButton,
  CloseButton,
  SaveButton,
} from "../../components/button";
import { Badge } from "../../components/badge";
import { Input } from "../../components/input";
import { Modal } from "../../components/modal";
import "./tierPanel.css";

interface TierPanelProps {
  presetId: number;
  tiers: any[];
}

export function TierPanel({ presetId, tiers }: TierPanelProps) {
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierName, setEditingTierName] = useState("");

  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleCreateTier = async () => {
    if (!newTierName.trim()) return;
    await createTier.mutateAsync({
      presetId,
      name: newTierName.trim(),
    });
    setNewTierName("");
    setShowTierForm(false);
  };

  const handleUpdateTierName = async (tierId: number) => {
    if (!editingTierName.trim()) return;
    await updateTier.mutateAsync({
      tierId,
      presetId,
      name: editingTierName.trim(),
    });
    setEditingTierId(null);
    setEditingTierName("");
  };

  const handleDeleteTier = async (tierId: number) => {
    if (!confirm("이 티어를 삭제하시겠습니까?")) return;
    await deleteTier.mutateAsync({ tierId, presetId });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleCreateTier();
  };

  return (
    <div className="tier-section-inline">
      <h3>티어 목록</h3>
      <div className="tier-list">
        {tiers?.map((tier: any) => (
          <div key={tier.tier_id} className="tier-item">
            {editingTierId === tier.tier_id ? (
              <>
                <Input
                  value={editingTierName}
                  onChange={setEditingTierName}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleUpdateTierName(tier.tier_id)
                  }
                  size="small"
                  autoFocus
                />
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <SaveButton
                    onClick={() => handleUpdateTierName(tier.tier_id)}
                    disabled={
                      editingTierName.trim() === tier.name ||
                      !editingTierName.trim()
                    }
                  />
                  <CloseButton
                    onClick={() => {
                      setEditingTierId(null);
                      setEditingTierName("");
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <Badge color="red">{tier.name.charAt(0)}</Badge>
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <EditButton
                    onClick={() => {
                      setEditingTierId(tier.tier_id);
                      setEditingTierName(tier.name);
                    }}
                  />
                  <DeleteButton
                    onClick={() => handleDeleteTier(tier.tier_id)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => setShowTierForm(true)}>추가</PrimaryButton>

      <Modal
        isOpen={showTierForm}
        onClose={() => setShowTierForm(false)}
        title="티어 추가"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>티어 이름</label>
            <Input
              type="text"
              value={newTierName}
              onChange={(value) => setNewTierName(value)}
            />
          </div>
          <div className="modal-actions">
            <SecondaryButton onClick={() => setShowTierForm(false)}>
              취소
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!newTierName.trim()}>
              추가
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
