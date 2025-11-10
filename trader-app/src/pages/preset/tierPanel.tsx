import { useState } from "preact/hooks";
import {
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
} from "@/hooks/useTierApi";
import {
  PrimaryButton,
  EditButton,
  DeleteButton,
  CloseButton,
  SaveButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Error } from "@/components/error";
import { CreateTierModal } from "./createTierModal";
import { ConfirmModal } from "@/components/confirmModal";
import "@/styles/pages/preset/tierPanel.css";

interface TierPanelProps {
  presetId: number;
  tiers: any[];
}

export function TierPanel({ presetId, tiers }: TierPanelProps) {
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierName, setEditingTierName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleCreateTier = async () => {
    if (!newTierName.trim()) return;
    try {
      await createTier.mutateAsync({
        presetId,
        name: newTierName.trim(),
      });
      setNewTierName("");
      setShowTierForm(false);
    } catch (err) {
      console.error("Failed to create tier:", err);
    }
  };

  const handleUpdateTierName = async (tierId: number) => {
    if (!editingTierName.trim()) return;
    try {
      await updateTier.mutateAsync({
        tierId,
        presetId,
        name: editingTierName.trim(),
      });
      setEditingTierId(null);
      setEditingTierName("");
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const handleDeleteTier = async () => {
    if (deleteTargetId === null) return;
    try {
      await deleteTier.mutateAsync({ tierId: deleteTargetId, presetId });
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete tier:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleCreateTier();
  };

  return (
    <>
      {(updateTier.isError || deleteTier.isError) && (
        <Error>티어 작업 중 오류가 발생했습니다.</Error>
      )}
      <div className="tier-panel-content">
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
                    variantSize="sm"
                    autoFocus
                  />
                  <div className="flex gap-1 items-center">
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
                  <Badge variantColor="red">{tier.name.charAt(0)}</Badge>
                  <div className="flex gap-1 items-center">
                    <EditButton
                      onClick={() => {
                        setEditingTierId(tier.tier_id);
                        setEditingTierName(tier.name);
                      }}
                    />
                    <DeleteButton
                      onClick={() => {
                        setDeleteTargetId(tier.tier_id);
                        setShowDeleteConfirm(true);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <PrimaryButton onClick={() => setShowTierForm(true)}>
          추가
        </PrimaryButton>
      </div>

      <CreateTierModal
        isOpen={showTierForm}
        onClose={() => setShowTierForm(false)}
        onSubmit={handleSubmit}
        tierName={newTierName}
        onNameChange={setNewTierName}
        error={createTier.error}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeleteTier}
        title="티어 삭제"
        message="정말 이 티어를 삭제하시겠습니까?"
        confirmText="삭제"
      />
    </>
  );
}
