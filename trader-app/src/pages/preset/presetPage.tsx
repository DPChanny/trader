import { useState } from "preact/hooks";
import { useUsers } from "@/hooks/useUserApi";
import {
  usePresets,
  usePresetDetail,
  useCreatePreset,
} from "@/hooks/usePresetApi";
import { useAddPresetUser } from "@/hooks/usePresetUserApi";
import { useCreateAuction } from "@/hooks/useAuctionApi";
import { PresetList } from "./presetList";
import { TierPanel } from "./tierPanel";
import { PresetUserEditor } from "./presetUserEditor";
import { CreatePresetModal } from "./createPresetModal";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import "./presetPage.css";

interface PresetPageProps {
  onNavigateToAuction?: () => void;
}

export function PresetPage({ onNavigateToAuction }: PresetPageProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedPresetUserId, setSelectedPresetUserId] = useState<
    number | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const {
    data: presets,
    isLoading: presetsLoading,
    error: presetsError,
  } = usePresets();
  const { data: users, error: usersError } = useUsers();
  const {
    data: presetDetail,
    isLoading: detailLoading,
    error: detailError,
  } = usePresetDetail(selectedPresetId);

  const addPresetUser = useAddPresetUser();
  const createPreset = useCreatePreset();
  const createAuction = useCreateAuction();

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    setSelectedPresetUserId(null);
  };

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      await createPreset.mutateAsync(newPresetName.trim());
      setNewPresetName("");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create preset:", err);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleCreatePreset();
  };

  const handleAddUser = async (userId: number) => {
    if (!selectedPresetId) return;
    try {
      await addPresetUser.mutateAsync({
        presetId: selectedPresetId,
        userId,
        tierId: null,
      });
    } catch (err) {
      console.error("Failed to add user:", err);
    }
  };

  const handleStartAuction = async () => {
    if (!selectedPresetId) return;
    try {
      await createAuction.mutateAsync(selectedPresetId);
      if (onNavigateToAuction) {
        onNavigateToAuction();
      }
    } catch (err) {
      console.error("Failed to create auction:", err);
    }
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
        <Section variant="primary" className="preset-list-container">
          <div className="preset-page-header">
            <h2>프리셋 관리</h2>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </div>
          <Bar variant="blue" />
          {presetsError && (
            <Error>프리셋 목록을 불러오는데 실패했습니다.</Error>
          )}
          {!presetsError && (
            <PresetList
              presets={presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              isLoading={presetsLoading}
            />
          )}
        </Section>

        <div className="preset-detail-section">
          {addPresetUser.isError && (
            <Error>유저를 프리셋에 추가하는데 실패했습니다.</Error>
          )}
          {detailError && selectedPresetId && (
            <Error>선택한 프리셋의 상세 정보를 불러오는데 실패했습니다.</Error>
          )}
          {usersError && selectedPresetId && (
            <Error>
              유저 목록을 불러오는데 실패했습니다. 프리셋에 유저를 추가할 수
              없습니다.
            </Error>
          )}
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError &&
          !usersError ? (
            <>
              <div className="preset-header-row">
                <Section variant="secondary" className="preset-title-section">
                  <div className="preset-title-content">
                    <h2>{presetDetail.name}</h2>
                    <PrimaryButton onClick={handleStartAuction}>
                      경매 시작
                    </PrimaryButton>
                  </div>
                </Section>
                <Section variant="secondary" className="tier-panel-section">
                  <TierPanel
                    presetId={presetDetail.preset_id}
                    tiers={presetDetail.tiers || []}
                  />
                </Section>
              </div>

              <div className="preset-detail">
                <div className="grid-container">
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title={`프리셋 유저 목록 (${
                        presetDetail.preset_users?.length || 0
                      }명)`}
                      users={presetUserItems}
                      selectedUserId={selectedPresetUserId}
                      onUserClick={(id) =>
                        setSelectedPresetUserId(id as number)
                      }
                    />
                  </Section>
                  <Section variant="secondary" className="grid-section">
                    <UserGrid
                      title="유저 목록 (선택 시 추가)"
                      users={availableUsers}
                      onUserClick={(id) => handleAddUser(id as number)}
                    />
                  </Section>
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
            <Loading />
          ) : (
            <div />
          )}
        </div>
      </div>

      <CreatePresetModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleSubmit}
        presetName={newPresetName}
        onNameChange={setNewPresetName}
        error={createPreset.error}
      />
    </div>
  );
}
