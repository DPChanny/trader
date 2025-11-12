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
import { AddPresetModal } from "./addPresetModal";
import { EditPresetModal } from "./editPresetModal";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { PageLayout, PageContainer } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { ConfirmModal } from "@/components/modal";
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
  const addPreset = useAddPreset();
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
    time: number,
    pointScale: number
  ) => {
    if (!editingPresetId || !name.trim()) return;
    try {
      await updatePreset.mutateAsync({
        presetId: editingPresetId,
        name: name.trim(),
        points: points,
        time: time,
        point_scale: pointScale,
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
      await addPreset.mutateAsync({
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
    if (!selectedPresetId || !presetDetail) return;

    const leaderCount = presetDetail.preset_leaders?.length || 0;
    const userCount = presetDetail.preset_users?.length || 0;
    const requiredUsers = leaderCount * 5;

    if (leaderCount < 2) {
      return;
    }

    if (userCount < requiredUsers) {
      return;
    }

    try {
      await addAuction.mutateAsync(selectedPresetId);
    } catch (err) {
      console.error("Failed to start auction:", err);
    }
  };

  const presetUserIds = presetDetail
    ? new Set(presetDetail.preset_users.map((pu) => pu.user_id))
    : new Set<number>();

  const availableUsers =
    users?.data
      ?.filter((user) => !presetUserIds.has(user.user_id))
      .map((user) => ({
        user_id: user.user_id,
        name: user.name,
        riot_id: user.riot_id,
        profile_url: user.profile_url,
      })) || [];

  const leaderUserIds = presetDetail
    ? new Set(presetDetail.preset_leaders.map((pl) => pl.user_id))
    : new Set<number>();

  const presetUserItems = presetDetail
    ? presetDetail.preset_users.map((pu) => {
        const isLeader = leaderUserIds.has(pu.user_id);
        const tierName = pu.tier_id
          ? presetDetail.tiers?.find((t) => t.tier_id === pu.tier_id)?.name
          : null;
        const positions = pu.positions?.map((p) => p.name) || [];

        return {
          user_id: pu.preset_user_id,
          name: pu.user.name,
          riot_id: pu.user.riot_id,
          profile_url: pu.user.profile_url,
          tier: tierName,
          positions,
          is_leader: isLeader,
        };
      })
    : [];

  const selectedPresetUser =
    selectedPresetUserId && presetDetail
      ? presetDetail.preset_users.find(
          (pu) => pu.preset_user_id === selectedPresetUserId
        )
      : null;

  return (
    <PageLayout>
      <PageContainer>
        <Section variantType="primary" className={styles.presetListSection}>
          <Section variantType="invisible" variantLayout="row">
            <h3>프리셋 목록</h3>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </Section>
          <Bar />
          {presetsError && (
            <Error>프리셋 목록을 불러오는데 실패했습니다.</Error>
          )}
          {!presetsError && (
            <>
              <PresetList
                presets={presets || []}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                onEditPreset={handleEditPreset}
                onDeletePreset={handleDeletePresetClick}
                isLoading={presetsLoading}
              />
              {selectedPresetId && presetDetail && (
                <div className={styles.auctionButtonWrapper}>
                  {(() => {
                    const leaderCount =
                      presetDetail.preset_leaders?.length || 0;
                    const userCount = presetDetail.preset_users?.length || 0;
                    const requiredUsers = leaderCount * 5;
                    const canStartAuction =
                      leaderCount >= 2 && userCount >= requiredUsers;

                    let validationMessage = "";
                    if (leaderCount < 2) {
                      validationMessage = `팀장이 부족합니다. (현재: ${leaderCount}명, 필요: 2명 이상)`;
                    } else if (userCount < requiredUsers) {
                      validationMessage = `유저가 부족합니다. (현재: ${userCount}명, 필요: ${requiredUsers}명)`;
                    }

                    return (
                      <>
                        <Section variantType="invisible">
                          <Bar />
                          <PrimaryButton
                            onClick={handleStartAuction}
                            disabled={addAuction.isPending || !canStartAuction}
                            className={styles.startAuctionButton}
                          >
                            {addAuction.isPending
                              ? "경매 생성 중"
                              : "경매 생성"}
                          </PrimaryButton>
                          {!canStartAuction && validationMessage && (
                            <Error>{validationMessage}</Error>
                          )}
                          {addAuction.isError && (
                            <Error>경매를 시작하는데 실패했습니다.</Error>
                          )}
                        </Section>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </Section>

        <Section variantType="primary" className={styles.presetDetailSection}>
          {addPresetUser.isError && (
            <Error>유저를 프리셋에 추가하는데 실패했습니다.</Error>
          )}
          {detailError && selectedPresetId && (
            <Error>프리셋의 상세 정보를 불러오는데 실패했습니다.</Error>
          )}
          {usersError && selectedPresetId && (
            <Error>유저 목록을 불러오는데 실패했습니다.</Error>
          )}
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError &&
          !usersError ? (
            <>
              <Section
                variantType="secondary"
                className={styles.tierPanelSection}
              >
                <TierPanel
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                />
              </Section>
              <Section variantType="secondary">
                <UserGrid
                  users={presetUserItems}
                  selectedUserId={selectedPresetUserId}
                  onUserClick={(id) => setSelectedPresetUserId(id as number)}
                  variant="compact"
                />
              </Section>
              <Section variantType="secondary">
                <UserGrid
                  users={availableUsers}
                  onUserClick={(id) => handleAddUser(id as number)}
                  variant="compact"
                />
              </Section>
              {selectedPresetUser && (
                <PresetUserEditor
                  presetUser={selectedPresetUser}
                  presetId={presetDetail.preset_id}
                  tiers={presetDetail.tiers || []}
                  leaders={presetDetail.preset_leaders || []}
                  onClose={() => setSelectedPresetUserId(null)}
                />
              )}
            </>
          ) : selectedPresetId && detailLoading ? (
            <Section variantType="secondary" className={styles.loadingSection}>
              <Loading />
            </Section>
          ) : (
            <div />
          )}
        </Section>

        <AddPresetModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSubmit={handleSubmit}
          presetName={newPresetName}
          onNameChange={setNewPresetName}
          points={points}
          onPointsChange={(value) => setPoints(parseInt(value) || 1000)}
          time={time}
          onTimeChange={(value) => setTime(parseInt(value) || 30)}
          isPending={addPreset.isPending}
          error={addPreset.error}
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
            presets?.find((p) => p.preset_id === editingPresetId)?.name || ""
          }
          points={
            presets?.find((p) => p.preset_id === editingPresetId)?.points ||
            1000
          }
          time={
            presets?.find((p) => p.preset_id === editingPresetId)?.time || 30
          }
          pointScale={
            presets?.find((p) => p.preset_id === editingPresetId)
              ?.point_scale || 1
          }
          isPending={updatePreset.isPending}
          error={updatePreset.error}
        />

        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeletePreset}
          title="프리셋 삭제"
          message="정말 이 프리셋을 삭제하시겠습니까?"
          confirmText="삭제"
          isPending={deletePreset.isPending}
        />
      </PageContainer>
    </PageLayout>
  );
}
