import {
  CloseButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Section } from "@/components/section";
import type { Position } from "@/dtos";
import { IconBadge } from "@/components/iconBadge";

interface PositionCardProps {
  position: Position;
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
  const hasChanges =
    editingName !== position.name ||
    editingIconUrl !== (position.iconUrl || "");

  return (
    <Section variantType="tertiary" variantLayout="row">
      {isEditing ? (
        <>
          <Input
            value={editingName}
            onChange={onEditingNameChange}
            onKeyPress={(e) => e.key === "Enter" && onSave()}
            variantSize="sm"
            autoFocus
          />
          <Input
            value={editingIconUrl}
            onChange={onEditingIconUrlChange}
            variantSize="sm"
          />
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantType="tertiary"
          >
            <SaveButton
              variantSize="sm"
              onClick={onSave}
              disabled={isUpdatePending || !hasChanges || !editingName.trim()}
            />
            <CloseButton variantSize="sm" onClick={onCancelEdit} />
          </Section>
        </>
      ) : (
        <>
          {position.iconUrl ? (
            <IconBadge
              src={position.iconUrl}
              alt={position.name}
              variantColor="blue"
              variantSize="lg"
            />
          ) : (
            <Badge variantColor="blue" variantSize="lg">
              {position.name.charAt(0)}
            </Badge>
          )}
          <EditButton variantSize="sm" onClick={onEdit} />
          <DeleteButton
            variantSize="sm"
            onClick={onDelete}
            disabled={isDeletePending}
          />
        </>
      )}
    </Section>
  );
}
