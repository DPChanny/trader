import { useEffect, useState } from "preact/hooks";
import { PresetUserCard } from "@/components/presetUserCard";
import { LolCard } from "@/components/lolCard";
import { ValCard } from "@/components/valCard";
import { Toggle } from "@/components/toggle";
import {
  useRemovePresetUser,
  useUpdatePresetUser,
} from "@/hooks/usePresetUserApi";
import {
  useAddPresetUserPosition,
  useDeletePresetUserPosition,
} from "@/hooks/usePresetUserPositionApi";
import { useLolInfo } from "@/hooks/useLolApi";
import { useValInfo } from "@/hooks/useValApi";
import { type Position, type PresetUserDetail, type Tier } from "@/dtos";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import { ConfirmModal } from "@/components/modal";
import { Loading } from "@/components/loading";
import styles from "@/styles/pages/preset/presetUserEditor.module.css";

interface PresetUserEditorProps {
  presetUser: PresetUserDetail;
  presetId: number;
  tiers: Tier[];
  positions: Position[];
  onClose: () => void;
  onRemoveStart?: (userId: number) => void;
  onRemoveError?: (userId: number) => void;
}

export function PresetUserEditor({
  presetUser,
  presetId,
  tiers,
  positions,
  onClose,
  onRemoveStart,
  onRemoveError,
}: PresetUserEditorProps) {
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetUserPosition = useAddPresetUserPosition();
  const deletePresetUserPosition = useDeletePresetUserPosition();
  const lolInfo = useLolInfo(presetUser.user.userId, false);
  const valInfo = useValInfo(presetUser.user.userId, false);

  const [isLeader, setIsLeader] = useState(presetUser.isLeader);
  const [tierId, setTierId] = useState<number | null>(
    presetUser.tierId || null
  );
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(
    presetUser.positions?.map((p) => p.position.positionId) || []
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsLeader(presetUser.isLeader);
    setTierId(presetUser.tierId || null);
    setSelectedPositionIds(
      presetUser.positions?.map((p) => p.position.positionId) || []
    );
  }, [
    presetUser.presetUserId,
    presetUser.isLeader,
    presetUser.tierId,
    presetUser.positions,
  ]);

  const initialPositionIds =
    presetUser.positions?.map((p) => p.position.positionId) || [];
  const hasChanges =
    isLeader !== presetUser.isLeader ||
    tierId !== presetUser.tierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
    try {
      if (isLeader !== presetUser.isLeader || tierId !== presetUser.tierId) {
        await updatePresetUser.mutateAsync({
          presetUserId: presetUser.presetUserId,
          presetId,
          tierId,
          isLeader,
        });
      }

      const positionIdsToAdd = selectedPositionIds.filter(
        (id) => !initialPositionIds.includes(id)
      );
      const positionIdsToRemove = initialPositionIds.filter(
        (id) => !selectedPositionIds.includes(id)
      );

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

      for (const positionId of positionIdsToAdd) {
        await addPresetUserPosition.mutateAsync({
          presetUserId: presetUser.presetUserId,
          positionId,
          presetId,
        } as any);
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
      setSelectedPositionIds([...selectedPositionIds, positionId]);
    }
  };

  const handleToggleTier = (id: number) => {
    setTierId((prev) => (prev === id ? null : id));
  };

  const handleRemoveUser = async () => {
    try {
      onRemoveStart?.(presetUser.user.userId);
      await removePresetUser.mutateAsync({
        presetUserId: presetUser.presetUserId,
        presetId,
      });
      onClose();
      // mutation \uc131\uacf5 \ud6c4\uc5d0\ub3c4 removingUserIds\uc5d0\uc11c \uc81c\uac70\ud558\uc9c0 \uc54a\uc74c
      // presetDetail\uc774 refetch\ub418\uba74 \uc790\ub3d9\uc73c\ub85c \uc815\ub9ac\ub428
    } catch (err) {
      console.error("Failed to remove preset user:", err);
      onRemoveError?.(presetUser.user.userId);
      setShowDeleteConfirm(false);
    }
  };

  const hasError =
    updatePresetUser.isError ||
    addPresetUserPosition.isError ||
    deletePresetUserPosition.isError ||
    removePresetUser.isError;

  const previewTier = tierId
    ? tiers?.find((t) => t.tierId === tierId) || null
    : null;
  const previewPositions = selectedPositionIds
    .map((id) => {
      const position = positions.find((p) => p.positionId === id);
      if (!position) return null;
      const existingPositionId =
        presetUser.positions?.find((p) => p.position.positionId === id)
          ?.presetUserPositionId || 0;
      return {
        presetUserPositionId: existingPositionId,
        presetUserId: presetUser.presetUserId,
        positionId: id,
        position: position,
      };
    })
    .filter((p) => p !== null) as any[];

  const previewPresetUser = {
    ...presetUser,
    tierId: tierId,
    tier: previewTier,
    isLeader: isLeader,
    positions: previewPositions,
  };

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
          <PresetUserCard presetUser={previewPresetUser} variant="compact" />
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
              onClick={() => handleToggleTier(tier.tierId)}
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

        <Bar />

        {/* LOL 정보 */}
        {lolInfo.isLoading ? (
          <Loading />
        ) : (
          <LolCard lolInfo={lolInfo.data ?? null} />
        )}

        <Bar />

        {/* VAL 정보 */}
        {valInfo.isLoading ? (
          <Loading />
        ) : (
          <ValCard valInfo={valInfo.data ?? null} />
        )}

        <Bar />

        <DangerButton
          variantSize="lg"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={removePresetUser.isPending}
        >
          유저 제거
        </DangerButton>
      </Section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleRemoveUser}
        title="유저 제거"
        message="정말 이 유저를 프리셋에서 제거하시겠습니까?"
        confirmText="제거"
        isPending={removePresetUser.isPending}
      />
    </Section>
  );
}
