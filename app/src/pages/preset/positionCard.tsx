import {
  EditButton,
  DeleteButton,
  SaveButton,
  CloseButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Section } from "@/components/section";

interface PositionCardProps {
  position: {
    position_id: number;
    name: string;
    icon_url?: string;
  };
  isEditing: boolean;
  editingName: string;
  editingIconUrl: string;
  onEditingNameChange: (name: string) => void;
  onEditingIconUrlChange: (iconUrl: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isUpdatePending: boolean;
  isDeletePending: boolean;
}

export function PositionCard({
  position,
  isEditing,
  editingName,
  editingIconUrl,
  onEditingNameChange,
  onEditingIconUrlChange,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  isUpdatePending,
  isDeletePending,
}: PositionCardProps) {
  return (
    <Section variantType="tertiary" variantLayout="column">
      {isEditing ? (
        <>
          <Input
            value={editingName}
            onChange={onEditingNameChange}
            placeholder="포지션 이름"
            onKeyPress={(e) => e.key === "Enter" && onSave()}
            variantSize="sm"
            autoFocus
          />
          <Input
            value={editingIconUrl}
            onChange={onEditingIconUrlChange}
            placeholder="아이콘 URL (선택사항)"
            onKeyPress={(e) => e.key === "Enter" && onSave()}
            variantSize="sm"
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <SaveButton
              variantSize="sm"
              onClick={onSave}
              disabled={
                isUpdatePending ||
                (editingName.trim() === position.name &&
                  editingIconUrl.trim() === (position.icon_url || "")) ||
                !editingName.trim()
              }
            />
            <CloseButton variantSize="sm" onClick={onCancelEdit} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {position.icon_url ? (
              <img
                src={position.icon_url}
                alt={position.name}
                style={{ width: "32px", height: "32px", borderRadius: "4px" }}
              />
            ) : (
              <Badge variantColor="blue" variantSize="lg">
                {position.name.charAt(0)}
              </Badge>
            )}
            <span>{position.name}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <EditButton variantSize="sm" onClick={onEdit} />
            <DeleteButton
              variantSize="sm"
              onClick={onDelete}
              disabled={isDeletePending}
            />
          </div>
        </>
      )}
    </Section>
  );
}
