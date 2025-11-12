import { useState } from "preact/hooks";
import { useAddTier, useUpdateTier, useDeleteTier } from "@/hooks/useTierApi";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { AddTierModal } from "./addTierModal";
import { ConfirmModal } from "@/components/modal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/preset/tierList.module.css";
import { Section } from "@/components/section";

interface TierListProps {
  presetId: number;
  tiers: any[];
  showTierForm: boolean;
  newTierName: string;
  onShowTierFormChange: (show: boolean) => void;
  onNewTierNameChange: (name: string) => void;
}

export function TierList({
  presetId,
  tiers,
  showTierForm,
  newTierName,
  onShowTierFormChange,
  onNewTierNameChange,
}: TierListProps) {
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
      onNewTierNameChange("");
      onShowTierFormChange(false);
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
    <Section variantTone="ghost" className={styles.contentSection}>
      <Bar />

      {(updateTier.isError || deleteTier.isError) && (
        <Error>티어 작업 중 오류가 발생했습니다.</Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="row"
        className={styles.tierList}
      >
        {tiers?.map((tier: any) => (
          <TierCard
            key={tier.tierId}
            tier={tier}
            isEditing={editingTierId === tier.tierId}
            editingName={editingTierName}
            onEditingNameChange={setEditingTierName}
            onEdit={() => {
              setEditingTierId(tier.tierId);
              setEditingTierName(tier.name);
            }}
            onSave={() => handleUpdateTierName(tier.tierId)}
            onCancelEdit={() => {
              setEditingTierId(null);
              setEditingTierName("");
            }}
            onDelete={() => {
              setDeleteTargetId(tier.tierId);
              setShowDeleteConfirm(true);
            }}
            isUpdatePending={updateTier.isPending}
            isDeletePending={deleteTier.isPending}
          />
        ))}
      </Section>

      <AddTierModal
        isOpen={showTierForm}
        onClose={() => onShowTierFormChange(false)}
        onSubmit={handleSubmit}
        tierName={newTierName}
        onNameChange={onNewTierNameChange}
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
  );
}
