import { useState } from "preact/hooks";
import { useUsers } from "@/hooks/useUserApi";
import {
  usePresets,
  usePresetDetail,
  useAddPreset,
  useUpdatePreset,
  useDeletePreset,
} from "@/hooks/usePresetApi";
import { useAddPresetUser } from "@/hooks/usePresetUserApi";
import { useAddAuction } from "@/hooks/useAuctionApi";
import { PresetList } from "./presetList";
import { TierPanel } from "./tierPanel";
import { PresetUserEditor } from "./presetUserEditor";
import { CreatePresetModal } from "./createPresetModal";
import { EditPresetModal } from "./editPresetModal";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { ConfirmModal } from "@/components/confirmModal";
import styles from "@/styles/pages/preset/presetPage.module.css";

export function PresetPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedPresetUserId, setSelectedPresetUserId] = useState<
    number | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [points, setPoints] = useState(1000);
  const [time, setTime] = useState(30);
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<number | null>(null);

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
  const createPreset = useAddPreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const addAuction = useAddAuction();

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    setSelectedPresetUserId(null);
  };

  const handleEditPreset = (presetId: number) => {
    setEditingPresetId(presetId);
    setIsEditingPreset(true);
  };

  const handleUpdatePreset = async (
    name: string,
    points: number,
    time: number
  ) => {
    if (!editingPresetId || !name.trim()) return;
    try {
      await updatePreset.mutateAsync({
        presetId: editingPresetId,
        name: name.trim(),
        points: points,
        time: time,
      });
      setIsEditingPreset(false);
      setEditingPresetId(null);
    } catch (err) {
      console.error("Failed to update preset:", err);
    }
  };

  const handleDeletePresetClick = (presetId: number) => {
    setDeletingPresetId(presetId);
    setShowDeleteConfirm(true);
  };

  const handleDeletePreset = async () => {
    if (!deletingPresetId) return;
    try {
      await deletePreset.mutateAsync(deletingPresetId);
      setShowDeleteConfirm(false);
      if (selectedPresetId === deletingPresetId) {
        setSelectedPresetId(null);
      }
      setDeletingPresetId(null);
    } catch (err) {
      console.error("Failed to delete preset:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddPreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      await createPreset.mutateAsync({
        name: newPresetName.trim(),
        points: points,
        time: time,
      });
      setNewPresetName("");
      setPoints(1000);
      setTime(30);
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to add preset:", err);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleAddPreset();
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
      const result = await addAuction.mutateAsync(selectedPresetId);
      if (result.success && result.data) {
        window.location.href = `/auction.html?id=${result.data.auction_id}`;
      }
    } catch (err) {
      console.error("Failed to start auction:", err);
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
        name: user.name,
        riot_id: user.riot_id,
      })) || [];

  const leaderUserIds = presetDetail
    ? new Set(presetDetail.leaders.map((leader: any) => leader.user_id))
    : new Set();

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
      name: presetUser.user.name,
      riot_id: presetUser.user.riot_id,
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
    <div className={styles.presetPage}>
      <div className={styles.presetContainer}>
        <Section variant="primary" className={styles.presetListContainer}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-semibold m-0">
              프리셋 관리
            </h2>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </div>
          <Bar variantColor="blue" />
          {presetsError && (
            <Error>프리셋 목록을 불러오는데 실패했습니다.</Error>
          )}
          {!presetsError && (
            <PresetList
              presets={presets || []}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onEditPreset={handleEditPreset}
              onDeletePreset={handleDeletePresetClick}
              isLoading={presetsLoading}
            />
          )}
        </Section>

        <div className={styles.presetDetailSection}>
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
              <Section variant="secondary" className={styles.tierPanelSection}>
                <TierPanel
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                />
              </Section>
              <div className={styles.presetDetail}>
                <div className={styles.gridContainer}>
                  <Section variant="secondary" className={styles.gridSection}>
                    <UserGrid
                      users={presetUserItems}
                      selectedUserId={selectedPresetUserId}
                      onUserClick={(id) =>
                        setSelectedPresetUserId(id as number)
                      }
                    />
                  </Section>
                  <Section variant="secondary" className={styles.gridSection}>
                    <UserGrid
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

      {selectedPresetId && presetDetail && !detailError && (
        <div className={styles.auctionButtonContainer}>
          <PrimaryButton
            onClick={handleStartAuction}
            disabled={addAuction.isPending}
            className={styles.startAuctionButton}
          >
            {addAuction.isPending ? "경매 시작 중..." : "경매 시작"}
          </PrimaryButton>
        </div>
      )}

      {addAuction.isError && <Error>경매를 시작하는데 실패했습니다.</Error>}

      <CreatePresetModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleSubmit}
        presetName={newPresetName}
        onNameChange={setNewPresetName}
        points={points}
        onPointsChange={(value) => setPoints(parseInt(value) || 1000)}
        time={time}
        onTimeChange={(value) => setTime(parseInt(value) || 30)}
        error={createPreset.error}
      />

      <EditPresetModal
        isOpen={isEditingPreset}
        onClose={() => {
          setIsEditingPreset(false);
          setEditingPresetId(null);
        }}
        onSubmit={handleUpdatePreset}
        presetId={editingPresetId}
        name={
          presets?.find((p: any) => p.preset_id === editingPresetId)?.name || ""
        }
        points={
          presets?.find((p: any) => p.preset_id === editingPresetId)?.points ||
          1000
        }
        time={
          presets?.find((p: any) => p.preset_id === editingPresetId)?.time || 30
        }
        error={updatePreset.error}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePreset}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
      />
    </div>
  );
}
