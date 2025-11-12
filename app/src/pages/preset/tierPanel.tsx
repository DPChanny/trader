import { useState } from "preact/hooks";
import { useAddTier, useUpdateTier, useDeleteTier } from "@/hooks/useTierApi";
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
import { AddTierModal } from "./addTierModal";
import { ConfirmModal } from "@/components/confirmModal";
import styles from "@/styles/pages/preset/tierPanel.module.css";

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

  const addTier = useAddTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleAddTier = async () => {
    if (!newTierName.trim()) return;
    try {
      await addTier.mutateAsync({
        presetId,
        name: newTierName.trim(),
      });
      setNewTierName("");
      setShowTierForm(false);
    } catch (err) {
      console.error("Failed to add tier:", err);
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
    await handleAddTier();
  };

  return (
    <>
      {(updateTier.isError || deleteTier.isError) && (
        <div className={styles.tierErrorContainer}>
          <Error>티어 작업 중 오류가 발생했습니다.</Error>
        </div>
      )}
      <div className={styles.tierPanelContent}>
        <h3 className={styles.tierTitle}>티어 관리</h3>
        <div className={styles.tierList}>
          {tiers?.map((tier: any) => (
            <div key={tier.tier_id} className={styles.tierItem}>
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
                  <div className={styles.tierItemActions}>
                    <SaveButton
                      variantSize="sm"
                      onClick={() => handleUpdateTierName(tier.tier_id)}
                      disabled={
                        updateTier.isPending ||
                        editingTierName.trim() === tier.name ||
                        !editingTierName.trim()
                      }
                    />
                    <CloseButton
                      variantSize="sm"
                      onClick={() => {
                        setEditingTierId(null);
                        setEditingTierName("");
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Badge variantColor="red" variantSize="lg">
                    {tier.name.charAt(0)}
                  </Badge>
                  <div className={styles.tierItemActions}>
                    <EditButton
                      variantSize="sm"
                      onClick={() => {
                        setEditingTierId(tier.tier_id);
                        setEditingTierName(tier.name);
                      }}
                    />
                    <DeleteButton
                      variantSize="sm"
                      onClick={() => {
                        setDeleteTargetId(tier.tier_id);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={deleteTier.isPending}
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

      <AddTierModal
        isOpen={showTierForm}
        onClose={() => setShowTierForm(false)}
        onSubmit={handleSubmit}
        tierName={newTierName}
        onNameChange={setNewTierName}
        isPending={addTier.isPending}
        error={addTier.error}
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
        isPending={deleteTier.isPending}
      />
    </>
  );
}
