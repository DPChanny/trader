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
import { type PresetUserDetail, type Tier, type Position } from "@/dtos";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import styles from "@/styles/pages/preset/presetUserEditor.module.css";

interface PresetUserEditorProps {
  presetUser: PresetUserDetail;
  presetId: number;
  tiers: Tier[];
  positions: Position[];
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

  const [initialIsLeader, setInitialIsLeader] = useState(presetUser.isLeader);
  const [initialTierId, setInitialTierId] = useState<number | null>(
    presetUser.tierId || null
  );
  const [initialPositionIds, setInitialPositionIds] = useState<number[]>(
    presetUser.positions?.map((p) => p.position.positionId) || []
  );

  const [isLeader, setIsLeader] = useState(initialIsLeader);
  const [tierId, setTierId] = useState<number | null>(initialTierId);
  const [selectedPositionIds, setSelectedPositionIds] =
    useState<number[]>(initialPositionIds);

  useEffect(() => {
    const newIsLeader = presetUser.isLeader;
    const newTierId = presetUser.tierId || null;
    const newPositionIds =
      presetUser.positions?.map((p) => p.position.positionId) || [];

    setInitialIsLeader(newIsLeader);
    setInitialTierId(newTierId);
    setInitialPositionIds(newPositionIds);
    setIsLeader(newIsLeader);
    setTierId(newTierId);
    setSelectedPositionIds(newPositionIds);
  }, [
    presetUser.presetUserId,
    presetUser.isLeader,
    presetUser.tierId,
    presetUser.positions,
  ]);

  const hasChanges =
    isLeader !== initialIsLeader ||
    tierId !== initialTierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
    try {
      // 1. Update tier and leader status first
      if (isLeader !== initialIsLeader || tierId !== initialTierId) {
        await updatePresetUser.mutateAsync({
          presetUserId: presetUser.presetUserId,
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

      // 2. Remove old positions first (순차 실행)
      for (const positionId of positionIdsToRemove) {
        const position = presetUser.positions?.find(
          (p) => p.position.positionId === positionId
        );
        if (position) {
          await deletePresetUserPosition.mutateAsync({
            presetUserPositionId: position.presetUserPositionId,
            presetId,
          } as any);
        }
      }

      // 3. Add new positions (순차 실행)
      for (const positionId of positionIdsToAdd) {
        await addPresetUserPosition.mutateAsync({
          presetUserId: presetUser.presetUserId,
          positionId,
          presetId,
        } as any);
      }

      // 4. Update initial states after all operations succeed
      setInitialIsLeader(isLeader);
      setInitialTierId(tierId);
      setInitialPositionIds(selectedPositionIds);
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
      setSelectedPositionIds([...selectedPositionIds, positionId]);
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
            userId={presetUser.userId}
            name={presetUser.user.name}
            riotId={presetUser.user.riotId}
            profileUrl={presetUser.user.profileUrl}
            tier={tierId ? tiers?.find((t) => t.tierId === tierId)?.name : null}
            positions={selectedPositionIds
              .map(
                (id) => positions.find((p) => p.positionId === id)?.name || ""
              )
              .filter((name) => name !== "")}
            isLeader={isLeader}
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
              key={tier.tierId}
              active={tierId === tier.tierId}
              color="red"
              onClick={() =>
                setTierId(tierId === tier.tierId ? null : tier.tierId)
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
              key={position.positionId}
              active={selectedPositionIds.includes(position.positionId)}
              color="blue"
              onClick={() => handleTogglePosition(position.positionId)}
            >
              {position.name}
            </Toggle>
          ))}
        </Section>

        <DangerButton
          variantSize="lg"
          onClick={() => handleRemoveUser(presetUser.presetUserId)}
          disabled={removePresetUser.isPending}
        >
          유저 제거
        </DangerButton>
      </Section>
    </Section>
  );
}
