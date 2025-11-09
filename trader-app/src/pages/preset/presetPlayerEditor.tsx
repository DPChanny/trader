import { UserCard } from "../../components/userCard";
import {
  useUpdatePresetUser,
  useRemovePresetUser,
} from "../../hooks/usePresetUserApi";
import {
  useAddPresetLeader,
  useRemovePresetLeader,
} from "../../hooks/usePresetLeaderApi";
import { useAddPosition, useDeletePosition } from "../../hooks/usePositionApi";
import { type PresetLeader } from "../../hooks/usePresetApi";
import { CloseButton } from "../../components/button";

interface PresetPlayerEditorProps {
  presetUser: any;
  presetId: number;
  tiers: any[];
  leaders: PresetLeader[];
  onClose: () => void;
}

const POSITIONS = ["TOP", "JUG", "MID", "SUP", "BOT"] as const;

export function PresetPlayerEditor({
  presetUser,
  presetId,
  tiers,
  leaders,
  onClose,
}: PresetPlayerEditorProps) {
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetLeader = useAddPresetLeader();
  const removePresetLeader = useRemovePresetLeader();
  const addPosition = useAddPosition();
  const deletePosition = useDeletePosition();

  const leaderUserIds = new Set(leaders.map((leader) => leader.user_id));

  const handleToggleLeader = async (userId: number) => {
    const isLeader = leaderUserIds.has(userId);
    if (isLeader) {
      const leader = leaders.find((l) => l.user_id === userId);
      if (leader) {
        await removePresetLeader.mutateAsync({
          presetLeaderId: leader.preset_leader_id,
          presetId,
        });
      }
    } else {
      await addPresetLeader.mutateAsync({
        presetId,
        userId,
      });
    }
  };

  const handleUpdateTier = async (
    presetUserId: number,
    tierId: number | null
  ) => {
    await updatePresetUser.mutateAsync({
      presetUserId,
      presetId,
      tierId,
    });
  };

  const handleTogglePosition = async (
    presetUserId: number,
    position: string
  ) => {
    const hasPosition = presetUser.positions.some(
      (p: any) => p.name === position
    );

    if (hasPosition) {
      const pos = presetUser.positions.find((p: any) => p.name === position);
      await deletePosition.mutateAsync({
        positionId: pos.position_id,
        presetId,
      });
    } else {
      // 최대 2개 포지션만 선택 가능
      if (presetUser.positions.length >= 2) {
        alert("포지션은 최대 2개까지만 선택할 수 있습니다.");
        return;
      }
      await addPosition.mutateAsync({
        presetUserId,
        presetId,
        name: position,
      });
    }
  };

  const handleRemoveUser = async (presetUserId: number) => {
    if (!confirm("이 유저를 제거하시겠습니까?")) return;
    await removePresetUser.mutateAsync({
      presetUserId,
      presetId,
    });
    onClose();
  };

  return (
    <div className="player-edit-panel">
      <div className="edit-panel-header">
        <h3>{presetUser.user.nickname}</h3>
        <CloseButton onClick={onClose} />
      </div>

      <div className="edit-panel-content">
        <UserCard
          nickname={presetUser.user.nickname}
          riot_nickname={presetUser.user.riot_nickname}
        />

        <div className="edit-section">
          <label className="edit-label">
            <input
              type="checkbox"
              checked={leaderUserIds.has(presetUser.user_id)}
              onChange={() => handleToggleLeader(presetUser.user_id)}
            />
            <span>리더로 지정</span>
          </label>
        </div>

        <div className="edit-section">
          <label className="edit-label">티어</label>
          <select
            value={presetUser.tier_id || ""}
            onChange={(e) =>
              handleUpdateTier(
                presetUser.preset_user_id,
                (e.target as HTMLSelectElement).value
                  ? parseInt((e.target as HTMLSelectElement).value)
                  : null
              )
            }
          >
            <option value="">없음</option>
            {tiers?.map((tier: any) => (
              <option key={tier.tier_id} value={tier.tier_id}>
                {tier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-section">
          <label className="edit-label">포지션</label>
          <div className="position-toggles">
            {POSITIONS.map((position) => {
              const hasPosition = presetUser.positions?.some(
                (p: any) => p.name === position
              );
              return (
                <button
                  key={position}
                  className={`position-toggle ${hasPosition ? "active" : ""}`}
                  onClick={() =>
                    handleTogglePosition(presetUser.preset_user_id, position)
                  }
                >
                  {position}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn-danger-full"
          onClick={() => handleRemoveUser(presetUser.preset_user_id)}
        >
          플레이어 제거
        </button>
      </div>
    </div>
  );
}
