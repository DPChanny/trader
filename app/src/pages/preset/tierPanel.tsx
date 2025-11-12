import { useState } from "preact/hooks";
import { useAddTier, useUpdateTier, useDeleteTier } from "@/hooks/useTierApi";
import { PrimaryButton } from "@/components/button";
import { Error } from "@/components/error";
import { AddTierModal } from "./addTierModal";
import { ConfirmModal } from "@/components/modal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/preset/tierPanel.module.css";
import { Section } from "@/components/section";

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
      <Section variantTone="ghost" variantLayout="row">
        <h3>티어 관리</h3>{" "}
        {(updateTier.isError || deleteTier.isError) && (
          <Error>티어 작업 중 오류가 발생했습니다.</Error>
        )}
        <div className={styles.tierList}>
          {tiers?.map((tier: any) => (
            <TierCard
              key={tier.tier_id}
              tier={tier}
              isEditing={editingTierId === tier.tier_id}
              editingName={editingTierName}
              onEditingNameChange={setEditingTierName}
              onEdit={() => {
                setEditingTierId(tier.tier_id);
                setEditingTierName(tier.name);
              }}
              onSave={() => handleUpdateTierName(tier.tier_id)}
              onCancelEdit={() => {
                setEditingTierId(null);
                setEditingTierName("");
              }}
              onDelete={() => {
                setDeleteTargetId(tier.tier_id);
                setShowDeleteConfirm(true);
              }}
              isUpdatePending={updateTier.isPending}
              isDeletePending={deleteTier.isPending}
            />
          ))}
        </div>
        <PrimaryButton onClick={() => setShowTierForm(true)}>
          추가
        </PrimaryButton>
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
      </Section>
    </>
  );
}
