import { useState } from "preact/hooks";
import {
  useAddPosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/hooks/usePositionApi";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { ConfirmModal } from "@/components/modal";
import { Section } from "@/components/section";
import { AddPositionModal } from "./addPositionModal";
import { EditPositionModal } from "./editPositionModal";
import { PositionCard } from "./positionCard";
import styles from "@/styles/pages/preset/positionList.module.css";

interface PositionListProps {
  presetId: number;
  positions: any[];
  showPositionForm: boolean;
  newPositionName: string;
  newPositionIconUrl: string;
  onShowPositionFormChange: (show: boolean) => void;
  onNewPositionNameChange: (name: string) => void;
  onNewPositionIconUrlChange: (url: string) => void;
}

export function PositionList({
  presetId,
  positions,
  showPositionForm,
  newPositionName,
  newPositionIconUrl,
  onShowPositionFormChange,
  onNewPositionNameChange,
  onNewPositionIconUrlChange,
}: PositionListProps) {
  const [editingPositionId, setEditingPositionId] = useState<number | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const addPosition = useAddPosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const editingPosition = positions?.find(
    (p) => p.position_id === editingPositionId
  );

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) return;
    try {
      await addPosition.mutateAsync({
        presetId: presetId,
        name: newPositionName.trim(),
        iconUrl: newPositionIconUrl.trim() || undefined,
      });
      onNewPositionNameChange("");
      onNewPositionIconUrlChange("");
      onShowPositionFormChange(false);
    } catch (err) {
      console.error("Failed to add position:", err);
    }
  };

  const handleUpdatePosition = async (name: string, iconUrl: string) => {
    if (!editingPositionId || !name.trim()) return;
    try {
      await updatePosition.mutateAsync({
        positionId: editingPositionId,
        presetId: presetId,
        name: name.trim(),
        iconUrl: iconUrl.trim() || undefined,
      });
      // Close modal after successful update
      setEditingPositionId(null);
    } catch (err) {
      console.error("Failed to update position:", err);
      // Don't close modal on error so user can retry
    }
  };

  const handleDeletePosition = async () => {
    if (deleteTargetId === null) return;
    try {
      await deletePosition.mutateAsync({
        positionId: deleteTargetId,
        presetId: presetId,
      });
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete position:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleAddPosition();
  };

  return (
    <Section variantTone="ghost" className={styles.contentSection}>
      <Bar />

      {(updatePosition.isError || deletePosition.isError) && (
        <Error>포지션 작업 중 오류가 발생했습니다.</Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="row"
        className={styles.positionList}
      >
        {positions?.map((position: any) => (
          <PositionCard
            key={position.position_id}
            position={position}
            onEdit={() => setEditingPositionId(position.position_id)}
            onDelete={() => {
              setDeleteTargetId(position.position_id);
              setShowDeleteConfirm(true);
            }}
            isDeletePending={deletePosition.isPending}
          />
        ))}
      </Section>

      <AddPositionModal
        isOpen={showPositionForm}
        onClose={() => onShowPositionFormChange(false)}
        onSubmit={handleSubmit}
        positionName={newPositionName}
        positionIconUrl={newPositionIconUrl}
        onNameChange={onNewPositionNameChange}
        onIconUrlChange={onNewPositionIconUrlChange}
        isPending={addPosition.isPending}
        error={addPosition.error}
      />

      <EditPositionModal
        isOpen={!!editingPositionId}
        onClose={() => setEditingPositionId(null)}
        onSubmit={handleUpdatePosition}
        positionId={editingPositionId}
        name={editingPosition?.name || ""}
        iconUrl={editingPosition?.icon_url || ""}
        isPending={updatePosition.isPending}
        error={updatePosition.error}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeletePosition}
        title="포지션 삭제"
        message="정말 이 포지션을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePosition.isPending}
      />
    </Section>
  );
}
