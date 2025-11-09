import { useState } from "preact/hooks";
import { useUsers } from "../../hooks/useUserApi";
import { usePresets, usePresetDetail } from "../../hooks/usePresetApi";
import { useAddPresetUser } from "../../hooks/usePresetUserApi";
import { PresetList } from "./presetList";
import { TierPanel } from "./tierPanel";
import { PresetPlayerGrid } from "./presetPlayerGrid";
import { AvailablePlayers } from "./playerList";
import { PresetPlayerEditor } from "./presetPlayerEditor";
import "./preset.css";

export function PresetPage() {
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
    users?.data?.filter((user: any) => !presetUserIds.has(user.user_id)) || [];

  const leaderUserIds = presetDetail
    ? new Set(presetDetail.leaders.map((leader: any) => leader.user_id))
    : new Set();

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
            <div className="preset-detail">
              <div className="preset-detail-main">
                <h2>{presetDetail.name}</h2>

                <TierPanel
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                />

                <PresetPlayerGrid
                  presetUsers={presetDetail.preset_users || []}
                  tiers={presetDetail.tiers || []}
                  leaderUserIds={leaderUserIds}
                  selectedPresetUserId={selectedPresetUserId}
                  onSelectPlayer={setSelectedPresetUserId}
                />

                <AvailablePlayers
                  users={availableUsers}
                  onAddUser={handleAddUser}
                />
              </div>

              {selectedPresetUser && (
                <PresetPlayerEditor
                  presetUser={selectedPresetUser}
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                  leaders={presetDetail.leaders || []}
                  onClose={() => setSelectedPresetUserId(null)}
                />
              )}
            </div>
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
