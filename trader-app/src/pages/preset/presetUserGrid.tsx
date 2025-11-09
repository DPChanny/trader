import { UserCard } from "../../components/userCard";

interface PresetUserGridProps {
  presetUsers: any[];
  tiers: any[];
  leaderUserIds: Set<number>;
  selectedPresetUserId: number | null;
  onSelectUser: (presetUserId: number) => void;
}

export function PresetUserGrid({
  presetUsers,
  tiers,
  leaderUserIds,
  selectedPresetUserId,
  onSelectUser,
}: PresetUserGridProps) {
  return (
    <div className="detail-section">
      <div className="section-header">
        <h3>유저 ({presetUsers.length}명)</h3>
      </div>

      <div className="user-grid-preset">
        {presetUsers.map((presetUser: any) => {
          const isLeader = leaderUserIds.has(presetUser.user_id);
          const tierName = presetUser.tier_id
            ? tiers?.find((t: any) => t.tier_id === presetUser.tier_id)?.name
            : null;
          const positions = presetUser.positions?.map((p: any) => p.name) || [];

          return (
            <div
              key={presetUser.preset_user_id}
              className={`user-grid-item ${
                selectedPresetUserId === presetUser.preset_user_id
                  ? "selected"
                  : ""
              }`}
              onClick={() => onSelectUser(presetUser.preset_user_id)}
            >
              <UserCard
                nickname={presetUser.user.nickname}
                riot_nickname={presetUser.user.riot_nickname}
                tier={tierName}
                positions={positions}
                is_leader={isLeader}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
