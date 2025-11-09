import { useState } from "preact/hooks";
import {
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
} from "../../hooks/useTierApi";
import {
  PrimaryButton,
  EditButton,
  DeleteButton,
  CloseButton,
  SaveButton,
} from "../../components/button";
import { Badge } from "../../components/badge";

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

  return (
    <div className="tier-section-inline">
      <h3>티어</h3>
      <div className="tier-list">
        {tiers?.map((tier: any) => (
          <div key={tier.tier_id} className="tier-item">
            {editingTierId === tier.tier_id ? (
              <>
                <input
                  type="text"
                  value={editingTierName}
                  onChange={(e) =>
                    setEditingTierName((e.target as HTMLInputElement).value)
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleUpdateTierName(tier.tier_id)
                  }
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
                <Badge color="red">{tier.name}</Badge>
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

        {showTierForm && (
          <div className="tier-item">
            <input
              type="text"
              placeholder="티어 이름"
              value={newTierName}
              onChange={(e) =>
                setNewTierName((e.target as HTMLInputElement).value)
              }
              onKeyPress={(e) => e.key === "Enter" && handleCreateTier()}
              autoFocus
            />
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <SaveButton
                onClick={handleCreateTier}
                disabled={!newTierName.trim()}
              />
              <CloseButton
                onClick={() => {
                  setShowTierForm(false);
                  setNewTierName("");
                }}
              />
            </div>
          </div>
        )}

        <PrimaryButton onClick={() => setShowTierForm(true)}>+</PrimaryButton>
      </div>
    </div>
  );
}
