import { useState } from "preact/hooks";
import { useUsers } from "../../hooks/useUserApi";
import { usePresets, usePresetDetail } from "../../hooks/usePresetApi";
import { useAddPresetUser } from "../../hooks/usePresetUserApi";
import { PresetList } from "./presetList";
import { TierPanel } from "./tierPanel";
import { PresetUserEditor } from "./presetUserEditor";
import { PrimaryButton } from "../../components/button";
import { UserGrid } from "../../components/userGrid";
import "./presetPage.css";

interface PresetPageProps {
  onStartAuction?: () => void;
}

export function PresetPage({ onStartAuction }: PresetPageProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedPresetUserId, setSelectedPresetUserId] = useState<
    number | null
  >(null);

  const { data: presets, isLoading: presetsLoading } = usePresets();
  const { data: users } = useUsers();
  const { data: presetDetail, isLoading: detailLoading } =
    usePresetDetail(selectedPresetId);

  const addPresetUser = useAddPresetUser();

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    setSelectedPresetUserId(null);
  };

  const handleAddUser = async (userId: number) => {
    if (!selectedPresetId) return;
    await addPresetUser.mutateAsync({
      presetId: selectedPresetId,
      userId,
      tierId: null,
    });
  };

  const presetUserIds = presetDetail
    ? new Set(presetDetail.preset_users.map((pu: any) => pu.user_id))
    : new Set();

  const availableUsers =
    users?.data
      ?.filter((user: any) => !presetUserIds.has(user.user_id))
      .map((user: any) => ({
        id: user.user_id,
        nickname: user.nickname,
        riot_nickname: user.riot_nickname,
      })) || [];

  const leaderUserIds = presetDetail
    ? new Set(presetDetail.leaders.map((leader: any) => leader.user_id))
    : new Set();

  // 팀장을 먼저 보이도록 정렬된 preset users
  const sortedPresetUsers = presetDetail
    ? [...presetDetail.preset_users].sort((a: any, b: any) => {
        const aIsLeader = leaderUserIds.has(a.user_id);
        const bIsLeader = leaderUserIds.has(b.user_id);
        if (aIsLeader && !bIsLeader) return -1;
        if (!aIsLeader && bIsLeader) return 1;
        return 0;
      })
    : [];

  const presetUserItems = sortedPresetUsers.map((presetUser: any) => {
    const isLeader = leaderUserIds.has(presetUser.user_id);
    const tierName = presetUser.tier_id
      ? presetDetail?.tiers?.find((t: any) => t.tier_id === presetUser.tier_id)
          ?.name
      : null;
    const positions = presetUser.positions?.map((p: any) => p.name) || [];

    return {
      id: presetUser.preset_user_id,
      nickname: presetUser.user.nickname,
      riot_nickname: presetUser.user.riot_nickname,
      tier: tierName,
      positions,
      is_leader: isLeader,
    };
  });

  const selectedPresetUser =
    selectedPresetUserId && presetDetail
      ? presetDetail.preset_users.find(
          (pu: any) => pu.preset_user_id === selectedPresetUserId
        )
      : null;

  return (
    <div className="preset-page">
      <div className="preset-container">
        <PresetList
          presets={presets || []}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          isLoading={presetsLoading}
        />

        <div className="preset-detail-section">
          {selectedPresetId && !detailLoading && presetDetail ? (
            <>
              <div className="preset-header-row">
                <div className="preset-title-actions">
                  <h2>{presetDetail.name}</h2>
                  {onStartAuction && (
                    <PrimaryButton onClick={onStartAuction}>
                      🎯 경매 시작
                    </PrimaryButton>
                  )}
                </div>
                <TierPanel
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                />
              </div>

              <div className="preset-detail">
                <div className="grid-container">
                  <UserGrid
                    title="유저"
                    count={presetDetail.preset_users?.length || 0}
                    users={presetUserItems}
                    selectedUserId={selectedPresetUserId}
                    onUserClick={(id) => setSelectedPresetUserId(id as number)}
                  />

                  <UserGrid
                    title="유저 추가"
                    users={availableUsers}
                    onUserClick={(id) => handleAddUser(id as number)}
                  />
                </div>

                {selectedPresetUser && (
                  <PresetUserEditor
                    presetUser={selectedPresetUser}
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                    leaders={presetDetail.leaders || []}
                    onClose={() => setSelectedPresetUserId(null)}
                  />
                )}
              </div>
            </>
          ) : selectedPresetId && detailLoading ? (
            <div className="loading">로딩중...</div>
          ) : (
            <div className="no-selection">프리셋을 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
