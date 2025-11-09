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
  SaveButton,
  CancelButton,
} from "../../components/button";

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
    <div className="detail-section">
      <div className="section-header">
        <h3>티어 관리</h3>
        <button className="btn-small" onClick={() => setShowTierForm(true)}>
          + 티어 추가
        </button>
      </div>

      {showTierForm && (
        <div className="tier-form">
          <input
            type="text"
            placeholder="티어 이름 (예: S, A, B)"
            value={newTierName}
            onChange={(e) =>
              setNewTierName((e.target as HTMLInputElement).value)
            }
            onKeyPress={(e) => e.key === "Enter" && handleCreateTier()}
          />
          <PrimaryButton onClick={handleCreateTier}>생성</PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setShowTierForm(false);
              setNewTierName("");
            }}
          >
            취소
          </SecondaryButton>
        </div>
      )}

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
                <SaveButton
                  onClick={() => handleUpdateTierName(tier.tier_id)}
                />
                <CancelButton
                  onClick={() => {
                    setEditingTierId(null);
                    setEditingTierName("");
                  }}
                />
              </>
            ) : (
              <>
                <span className="tier-badge">{tier.name}</span>
                <EditButton
                  onClick={() => {
                    setEditingTierId(tier.tier_id);
                    setEditingTierName(tier.name);
                  }}
                />
                <DeleteButton onClick={() => handleDeleteTier(tier.tier_id)} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
