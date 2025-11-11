import { useState, useEffect } from "preact/hooks";
import { UserCard } from "@/components/userCard";
import { Toggle } from "@/components/toggle";
import {
  useUpdatePresetUser,
  useRemovePresetUser,
} from "@/hooks/usePresetUserApi";
import {
  useAddPresetLeader,
  useRemovePresetLeader,
} from "@/hooks/usePresetLeaderApi";
import { useAddPosition, useDeletePosition } from "@/hooks/usePositionApi";
import { type PresetLeader } from "@/dtos";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import styles from "@/styles/pages/preset/presetUserEditor.module.css";

interface PresetUserEditorProps {
  presetUser: any;
  presetId: number;
  tiers: any[];
  leaders: PresetLeader[];
  onClose: () => void;
}

const POSITIONS = ["TOP", "JUG", "MID", "SUP", "BOT"] as const;

export function PresetUserEditor({
  presetUser,
  presetId,
  tiers,
  leaders,
  onClose,
}: PresetUserEditorProps) {
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetLeader = useAddPresetLeader();
  const removePresetLeader = useRemovePresetLeader();
  const addPosition = useAddPosition();
  const deletePosition = useDeletePosition();

  const leaderUserIds = new Set(leaders.map((leader) => leader.user_id));
  const initialIsLeader = leaderUserIds.has(presetUser.user_id);
  const initialTierId = presetUser.tier_id || null;
  const initialPositions =
    (presetUser.positions?.map((p: any) => p.name) as string[]) || [];

  const [isLeader, setIsLeader] = useState(initialIsLeader);
  const [tierId, setTierId] = useState<number | null>(initialTierId);
  const [selectedPositions, setSelectedPositions] =
    useState<string[]>(initialPositions);

  // presetUser가 변경될 때마다 상태를 다시 초기화
  useEffect(() => {
    const newLeaderUserIds = new Set(leaders.map((leader) => leader.user_id));
    const newIsLeader = newLeaderUserIds.has(presetUser.user_id);
    const newTierId = presetUser.tier_id || null;
    const newPositions =
      (presetUser.positions?.map((p: any) => p.name) as string[]) || [];

    setIsLeader(newIsLeader);
    setTierId(newTierId);
    setSelectedPositions(newPositions);
  }, [
    presetUser.preset_user_id,
    presetUser.user_id,
    presetUser.tier_id,
    presetUser.positions,
    leaders,
  ]);

  const hasChanges =
    isLeader !== initialIsLeader ||
    tierId !== initialTierId ||
    selectedPositions.length !== initialPositions.length ||
    selectedPositions.some((pos) => !initialPositions.includes(pos));

  const handleSave = async () => {
    try {
      // Save leader status
      if (isLeader !== initialIsLeader) {
        if (isLeader) {
          await addPresetLeader.mutateAsync({
            presetId,
            userId: presetUser.user_id,
          });
        } else {
          const leader = leaders.find((l) => l.user_id === presetUser.user_id);
          if (leader) {
            await removePresetLeader.mutateAsync({
              presetLeaderId: leader.preset_leader_id,
              presetId,
            });
          }
        }
      }

      // Save tier
      if (tierId !== initialTierId) {
        await updatePresetUser.mutateAsync({
          presetUserId: presetUser.preset_user_id,
          presetId,
          tierId,
        });
      }

      // Save positions
      const positionsToAdd = selectedPositions.filter(
        (pos) => !initialPositions.includes(pos)
      );
      const positionsToRemove = initialPositions.filter(
        (pos) => !selectedPositions.includes(pos)
      );

      for (const position of positionsToAdd) {
        await addPosition.mutateAsync({
          presetUserId: presetUser.preset_user_id,
          presetId,
          name: position,
        });
      }

      for (const position of positionsToRemove) {
        const pos = presetUser.positions.find((p: any) => p.name === position);
        if (pos) {
          await deletePosition.mutateAsync({
            positionId: pos.position_id,
            presetId,
          });
        }
      }
    } catch (err) {
      console.error("Failed to save preset user:", err);
    }
  };

  const handleTogglePosition = (position: string) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter((p) => p !== position));
    } else {
      if (selectedPositions.length >= 2) {
        setSelectedPositions([...selectedPositions.slice(1), position]);
      } else {
        setSelectedPositions([...selectedPositions, position]);
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
    addPresetLeader.isError ||
    removePresetLeader.isError ||
    addPosition.isError ||
    deletePosition.isError ||
    removePresetUser.isError;

  return (
    <div className={styles.userEditPanel}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-base font-semibold m-0">
          {presetUser.user.name}
        </h3>
        <div className="flex gap-2 items-center">
          <SaveButton onClick={handleSave} disabled={!hasChanges} />
          <CloseButton onClick={onClose} />
        </div>
      </div>
      <Bar variantColor="blue" />

      {hasError && <Error>프리셋 유저 정보 저장에 실패했습니다.</Error>}

      <div className={styles.editPanelContent}>
        <div className="flex justify-center">
          <UserCard
            name={presetUser.user.name}
            riot_id={presetUser.user.riot_id}
            tier={
              tierId
                ? tiers?.find((t: any) => t.tier_id === tierId)?.name
                : null
            }
            positions={selectedPositions}
            is_leader={isLeader}
          />
        </div>

        <div className={styles.editSection}>
          <div className={styles.toggleGroup}>
            <Toggle
              active={isLeader}
              color="gold"
              onClick={() => setIsLeader(!isLeader)}
            >
              팀장
            </Toggle>
          </div>
        </div>

        <div className={styles.editSection}>
          <Label>티어</Label>
          <div className={styles.toggleGroup}>
            {tiers?.map((tier: any) => (
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
          </div>
        </div>

        <div className={styles.editSection}>
          <Label>포지션</Label>
          <div className={styles.toggleGroup}>
            {POSITIONS.map((position) => (
              <Toggle
                key={position}
                active={selectedPositions.includes(position)}
                color="blue"
                onClick={() => handleTogglePosition(position)}
              >
                {position}
              </Toggle>
            ))}
          </div>
        </div>

        <DangerButton
          onClick={() => handleRemoveUser(presetUser.preset_user_id)}
        >
          유저 제거
        </DangerButton>
      </div>
    </div>
  );
}
