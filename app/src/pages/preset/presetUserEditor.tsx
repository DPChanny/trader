import { useState, useEffect } from "preact/hooks";
import { UserCard } from "@/components/userCard";
import { Toggle } from "@/components/toggle";
import {
  useUpdatePresetUser,
  useRemovePresetUser,
} from "@/hooks/usePresetUserApi";
import {
  useAddPresetUserPosition,
  useDeletePresetUserPosition,
} from "@/hooks/usePresetUserPositionApi";
import { type PresetUser, type Tier } from "@/dtos";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import styles from "@/styles/pages/preset/presetUserEditor.module.css";

interface PresetUserEditorProps {
  presetUser: PresetUser;
  presetId: number;
  tiers: Tier[];
  positions: {
    position_id: number;
    preset_id: number;
    name: string;
    icon_url?: string | null;
  }[];
  onClose: () => void;
}

export function PresetUserEditor({
  presetUser,
  presetId,
  tiers,
  positions,
  onClose,
}: PresetUserEditorProps) {
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetUserPosition = useAddPresetUserPosition();
  const deletePresetUserPosition = useDeletePresetUserPosition();

  const initialIsLeader = presetUser.is_leader;
  const initialTierId = presetUser.tier_id || null;
  const initialPositionIds =
    presetUser.positions?.map((p) => p.position.position_id) || [];

  const [isLeader, setIsLeader] = useState(initialIsLeader);
  const [tierId, setTierId] = useState<number | null>(initialTierId);
  const [selectedPositionIds, setSelectedPositionIds] =
    useState<number[]>(initialPositionIds);

  useEffect(() => {
    const newIsLeader = presetUser.is_leader;
    const newTierId = presetUser.tier_id || null;
    const newPositionIds =
      presetUser.positions?.map((p) => p.position.position_id) || [];

    setIsLeader(newIsLeader);
    setTierId(newTierId);
    setSelectedPositionIds(newPositionIds);
  }, [
    presetUser.preset_user_id,
    presetUser.is_leader,
    presetUser.tier_id,
    presetUser.positions,
  ]);

  const hasChanges =
    isLeader !== initialIsLeader ||
    tierId !== initialTierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
    try {
      if (isLeader !== initialIsLeader || tierId !== initialTierId) {
        await updatePresetUser.mutateAsync({
          presetUserId: presetUser.preset_user_id,
          presetId,
          tierId,
          isLeader,
        });
      }

      // Find position_ids to add and remove
      const positionIdsToAdd = selectedPositionIds.filter(
        (id) => !initialPositionIds.includes(id)
      );
      const positionIdsToRemove = initialPositionIds.filter(
        (id) => !selectedPositionIds.includes(id)
      );

      // Add new positions
      for (const positionId of positionIdsToAdd) {
        await addPresetUserPosition.mutateAsync({
          presetUserId: presetUser.preset_user_id,
          positionId,
        });
      }

      // Remove positions - need to find preset_user_position_id
      for (const positionId of positionIdsToRemove) {
        const position = presetUser.positions?.find(
          (p) => p.position.position_id === positionId
        );
        if (position) {
          await deletePresetUserPosition.mutateAsync({
            presetUserPositionId: position.preset_user_position_id,
          });
        }
      }
    } catch (err) {
      console.error("Failed to save preset user:", err);
    }
  };

  const handleTogglePosition = (positionId: number) => {
    if (selectedPositionIds.includes(positionId)) {
      setSelectedPositionIds(
        selectedPositionIds.filter((id) => id !== positionId)
      );
    } else {
      if (selectedPositionIds.length >= 2) {
        setSelectedPositionIds([...selectedPositionIds.slice(1), positionId]);
      } else {
        setSelectedPositionIds([...selectedPositionIds, positionId]);
      }
    }
  };

  const handleRemoveUser = async (presetUserId: number) => {
    try {
      await removePresetUser.mutateAsync({
        presetUserId,
        presetId,
      });
      onClose();
    } catch (err) {
      console.error("Failed to remove preset user:", err);
    }
  };

  const hasError =
    updatePresetUser.isError ||
    addPresetUserPosition.isError ||
    deletePresetUserPosition.isError ||
    removePresetUser.isError;

  return (
    <Section variantType="primary" className={styles.panel}>
      <Section variantTone="ghost" variantLayout="row">
        <h3>{presetUser.user.name}</h3>
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantType="secondary"
        >
          <SaveButton
            onClick={handleSave}
            disabled={updatePresetUser.isPending || !hasChanges}
          />
          <CloseButton onClick={onClose} />
        </Section>
      </Section>
      <Bar />

      {hasError && <Error>프리셋 유저 정보 저장에 실패했습니다.</Error>}

      <Section variantTone="ghost">
        <Section variantTone="ghost" className={styles.cardSection}>
          <UserCard
            user_id={presetUser.user_id}
            name={presetUser.user.name}
            riot_id={presetUser.user.riot_id}
            profile_url={presetUser.user.profile_url}
            tier={
              tierId ? tiers?.find((t) => t.tier_id === tierId)?.name : null
            }
            positions={selectedPositionIds
              .map(
                (id) => positions.find((p) => p.position_id === id)?.name || ""
              )
              .filter((name) => name !== "")}
            is_leader={isLeader}
            variant="compact"
          />
        </Section>

        <Label>팀장</Label>
        <Section variantType="secondary">
          <Toggle
            active={isLeader}
            color="gold"
            onClick={() => setIsLeader(!isLeader)}
          >
            팀장
          </Toggle>
        </Section>

        <Label>티어</Label>
        <Section
          variantLayout="row"
          variantType="secondary"
          className={styles.toggleSection}
        >
          {tiers?.map((tier) => (
            <Toggle
              key={tier.tier_id}
              active={tierId === tier.tier_id}
              color="red"
              onClick={() =>
                setTierId(tierId === tier.tier_id ? null : tier.tier_id)
              }
            >
              {tier.name}
            </Toggle>
          ))}
        </Section>

        <Label>포지션</Label>
        <Section
          variantLayout="row"
          variantType="secondary"
          className={styles.toggleSection}
        >
          {positions.map((position) => (
            <Toggle
              key={position.position_id}
              active={selectedPositionIds.includes(position.position_id)}
              color="blue"
              onClick={() => handleTogglePosition(position.position_id)}
            >
              {position.name}
            </Toggle>
          ))}
        </Section>

        <DangerButton
          variantSize="lg"
          onClick={() => handleRemoveUser(presetUser.preset_user_id)}
          disabled={removePresetUser.isPending}
        >
          유저 제거
        </DangerButton>
      </Section>
    </Section>
  );
}
