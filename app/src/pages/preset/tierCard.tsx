import {CloseButton, DeleteButton, EditButton, SaveButton,} from "@/components/button";
import {Badge} from "@/components/badge";
import {Input} from "@/components/input";
import {Section} from "@/components/section";

interface TierCardProps {
    tier: {
        tierId: number;
        name: string;
    };
    isEditing: boolean;
    editingName: string;
    onEditingNameChange: (name: string) => void;
    onEdit: () => void;
    onSave: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    isUpdatePending: boolean;
    isDeletePending: boolean;
}

export function TierCard({
                             tier,
                             isEditing,
                             editingName,
                             onEditingNameChange,
                             onEdit,
                             onSave,
                             onCancelEdit,
                             onDelete,
                             isUpdatePending,
                             isDeletePending,
                         }: TierCardProps) {
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
                    <Section variantTone="ghost" variantLayout="row" variantType="tertiary">
                        <SaveButton
                            variantSize="sm"
                            onClick={onSave}
                            disabled={
                                isUpdatePending ||
                                editingName.trim() === tier.name ||
                                !editingName.trim()
                            }
                        />
                        <CloseButton variantSize="sm" onClick={onCancelEdit}/>
                    </Section>
                </>
            ) : (
                <>
                    <Badge variantColor="red" variantSize="lg">
                        {tier.name.charAt(0)}
                    </Badge>
                    <EditButton variantSize="sm" onClick={onEdit}/>
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
