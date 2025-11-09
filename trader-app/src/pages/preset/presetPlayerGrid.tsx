import { UserCard } from "../../components/userCard";

interface PresetPlayerGridProps {
  presetUsers: any[];
  tiers: any[];
  leaderUserIds: Set<number>;
  selectedPresetUserId: number | null;
  onSelectPlayer: (presetUserId: number) => void;
}

export function PresetPlayerGrid({
  presetUsers,
  tiers,
  leaderUserIds,
  selectedPresetUserId,
  onSelectPlayer,
}: PresetPlayerGridProps) {
  return (
    <div className="detail-section">
      <div className="section-header">
        <h3>플레이어 ({presetUsers.length}명)</h3>
      </div>

      <div className="player-grid">
        {presetUsers.map((presetUser: any) => {
          const isLeader = leaderUserIds.has(presetUser.user_id);
          const tierName = presetUser.tier_id
            ? tiers?.find((t: any) => t.tier_id === presetUser.tier_id)?.name
            : null;
          const positions = presetUser.positions?.map((p: any) => p.name) || [];

          return (
            <div
              key={presetUser.preset_user_id}
              className={`player-card-compact ${
                selectedPresetUserId === presetUser.preset_user_id
                  ? "selected"
                  : ""
              }`}
              onClick={() => onSelectPlayer(presetUser.preset_user_id)}
            >
              <UserCard
                nickname={presetUser.user.nickname}
                riot_nickname={presetUser.user.riot_nickname}
              />
              <div className="player-badges">
                {tierName && (
                  <div
                    className="badge-icon tier-badge"
                    title={`티어: ${tierName}`}
                  >
                    {tierName}
                  </div>
                )}
                {isLeader && (
                  <div className="badge-icon leader-badge" title="리더">
                    👑
                  </div>
                )}
                {positions.map((pos: string) => (
                  <div
                    key={pos}
                    className="badge-icon position-badge"
                    title={`포지션: ${pos}`}
                  >
                    {pos.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
