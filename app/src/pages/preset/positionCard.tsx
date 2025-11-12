import { EditButton, DeleteButton } from "@/components/button";
import { Badge } from "@/components/badge";
import { Section } from "@/components/section";

interface PositionCardProps {
  position: {
    position_id: number;
    name: string;
    iconUrl?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
}

export function PositionCard({
  position,
  onEdit,
  onDelete,
  isDeletePending,
}: PositionCardProps) {
  return (
    <Section variantType="tertiary" variantLayout="column">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {position.iconUrl ? (
          <img
            src={position.iconUrl}
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
    </Section>
  );
}
