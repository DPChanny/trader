import { useState, useEffect, useMemo } from "preact/hooks";
import { useUsers } from "@/hooks/useUserApi";
import {
  useAddPreset,
  usePresetDetail,
  usePresets,
} from "@/hooks/usePresetApi";
import { useAddPresetUser } from "@/hooks/usePresetUserApi";
import { useAddAuction } from "@/hooks/useAuctionApi";
import { PresetList } from "./presetList";
import { TierList } from "./tierList";
import { PositionList } from "./positionList";
import { PresetUserEditor } from "./presetUserEditor";
import { AddPresetModal } from "./addPresetModal";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { PresetUserGrid } from "@/components/presetUserGrid";
import { Section } from "@/components/section";
import { PageContainer, PageLayout } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import type { Statistics } from "@/dtos";
import styles from "@/styles/pages/preset/presetPage.module.css";

interface PresetPageProps {
  path?: string;
}

export function PresetPage({}: PresetPageProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedPresetUserId, setSelectedPresetUserId] = useState<
    number | null
  >(null);
  const [addingUserIds, setAddingUserIds] = useState<Set<number>>(new Set());
  const [removingUserIds, setRemovingUserIds] = useState<Set<number>>(
    new Set()
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [points, setPoints] = useState(1000);
  const [pointScale, setPointScale] = useState(1);
  const [time, setTime] = useState(30);
  const [statistics, setStatistics] = useState<Statistics>("NONE");
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");

  const [showPositionForm, setShowPositionForm] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionIconUrl, setNewPositionIconUrl] = useState("");

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
  const addAuction = useAddAuction();

  // presetDetail이 업데이트되면 이미 추가된 유저들을 addingUserIds에서 제거
  // 제거된 유저들을 removingUserIds에서 제거
  useEffect(() => {
    if (presetDetail) {
      const presetUserIds = new Set(
        presetDetail.presetUsers.map((pu) => pu.userId)
      );

      // addingUserIds 정리
      if (addingUserIds.size > 0) {
        setAddingUserIds((prev) => {
          const next = new Set(prev);
          let changed = false;
          prev.forEach((userId) => {
            if (presetUserIds.has(userId)) {
              next.delete(userId);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }

      // removingUserIds 정리
      if (removingUserIds.size > 0) {
        setRemovingUserIds((prev) => {
          const next = new Set(prev);
          let changed = false;
          prev.forEach((userId) => {
            if (!presetUserIds.has(userId)) {
              next.delete(userId);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [presetDetail]);

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    setSelectedPresetUserId(null);
    setAddingUserIds(new Set()); // 프리셋 변경 시 addingUserIds 초기화
    setRemovingUserIds(new Set()); // 프리셋 변경 시 removingUserIds 초기화
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    try {
      await addPreset.mutateAsync({
        name: newPresetName.trim(),
        points,
        time,
        pointScale,
        statistics,
      });
      setNewPresetName("");
      setPoints(1000);
      setPointScale(1);
      setTime(30);
      setStatistics("NONE");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to add preset:", err);
    }
  };

  const handleStartAuction = async () => {
    if (!selectedPresetId || !presetDetail) return;

    const leaderCount =
      presetDetail.presetUsers?.filter((pu) => pu.isLeader).length || 0;
    const userCount = presetDetail.presetUsers?.length || 0;
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

  const handleClosePresetUserEditor = () => {
    setSelectedPresetUserId(null);
  };

  const onPresetDeleted = (deletedId: number) => {
    if (selectedPresetId === deletedId) {
      setSelectedPresetId(null);
    }
  };

  const presetUserIds = presetDetail
    ? new Set(presetDetail.presetUsers.map((pu) => pu.userId))
    : new Set<number>();

  const userGridUsers =
    users?.filter(
      (user) =>
        !presetUserIds.has(user.userId) && !addingUserIds.has(user.userId)
    ) || [];

  const selectedPresetUser = useMemo(
    () =>
      selectedPresetUserId && presetDetail
        ? presetDetail.presetUsers.find(
            (pu) => pu.presetUserId === selectedPresetUserId
          )
        : null,
    [selectedPresetUserId, presetDetail]
  );

  const leaderCount =
    presetDetail?.presetUsers?.filter((pu) => pu.isLeader).length || 0;
  const userCount = presetDetail?.presetUsers?.length || 0;
  const requiredUsers = leaderCount * 5;
  const canStartAuction = leaderCount >= 2 && userCount >= requiredUsers;

  let auctionValidationMessage = "";
  if (selectedPresetId && presetDetail) {
    if (leaderCount < 2) {
      auctionValidationMessage = `팀장이 부족합니다. (현재: ${leaderCount}명, 필요: 2명 이상)`;
    } else if (userCount < requiredUsers) {
      auctionValidationMessage = `유저가 부족합니다. (현재: ${userCount}명, 필요: ${requiredUsers}명)`;
    }
  }

  return (
    <PageLayout>
      <PageContainer>
        <Section variantType="primary" className={styles.presetListSection}>
          <Section variantTone="ghost" variantLayout="row">
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
                isLoading={presetsLoading}
                onPresetDeleted={onPresetDeleted}
              />
              {selectedPresetId && presetDetail && (
                <div className={styles.auctionButtonWrapper}>
                  <Section variantTone="ghost">
                    <Bar />
                    <PrimaryButton
                      onClick={handleStartAuction}
                      disabled={addAuction.isPending || !canStartAuction}
                      className={styles.startAuctionButton}
                    >
                      {addAuction.isPending ? "경매 생성 중" : "경매 생성"}
                    </PrimaryButton>
                    {!canStartAuction && auctionValidationMessage && (
                      <Error>{auctionValidationMessage}</Error>
                    )}
                    {addAuction.isError && (
                      <Error>경매를 시작하는데 실패했습니다.</Error>
                    )}
                  </Section>
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
              <Section variantTone="ghost" variantLayout="row">
                <Section variantType="secondary" className={styles.tierSection}>
                  <Section variantTone="ghost" variantLayout="row">
                    <h3>티어 목록</h3>
                    <PrimaryButton onClick={() => setShowTierForm(true)}>
                      추가
                    </PrimaryButton>
                  </Section>
                  <TierList
                    presetId={presetDetail.presetId}
                    tiers={presetDetail.tiers || []}
                    showTierForm={showTierForm}
                    newTierName={newTierName}
                    onShowTierFormChange={setShowTierForm}
                    onNewTierNameChange={setNewTierName}
                  />
                </Section>
                <Section
                  variantType="secondary"
                  className={styles.positionSection}
                >
                  <Section variantTone="ghost" variantLayout="row">
                    <h3>포지션 목록</h3>
                    <PrimaryButton onClick={() => setShowPositionForm(true)}>
                      추가
                    </PrimaryButton>
                  </Section>
                  <PositionList
                    presetId={presetDetail.presetId}
                    positions={presetDetail.positions || []}
                    showPositionForm={showPositionForm}
                    newPositionName={newPositionName}
                    newPositionIconUrl={newPositionIconUrl}
                    onShowPositionFormChange={setShowPositionForm}
                    onNewPositionNameChange={setNewPositionName}
                    onNewPositionIconUrlChange={setNewPositionIconUrl}
                  />
                </Section>
              </Section>
              <Section
                variantType="secondary"
                className={styles.userGridSection}
              >
                <PresetUserGrid
                  presetUsers={presetDetail.presetUsers.filter(
                    (pu) => !removingUserIds.has(pu.userId)
                  )}
                  selectedUserId={selectedPresetUserId}
                  onUserClick={(id) => setSelectedPresetUserId(id as number)}
                  variant="compact"
                />
              </Section>
              <Section
                variantType="secondary"
                className={styles.userGridSection}
              >
                <UserGrid
                  users={userGridUsers}
                  onUserClick={async (id) => {
                    if (!selectedPresetId) return;
                    const userId = id as number;
                    setAddingUserIds((prev) => new Set(prev).add(userId));
                    try {
                      await addPresetUser.mutateAsync({
                        presetId: selectedPresetId,
                        userId: userId,
                        tierId: null,
                      });
                      // mutation 성공 후 addingUserIds는 제거하지 않음
                      // presetDetail이 refetch되면 presetUserIds에 포함되어 자동으로 필터링됨
                    } catch (err) {
                      console.error("Failed to add user:", err);
                      // 실패 시에만 addingUserIds에서 제거
                      setAddingUserIds((prev) => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                      });
                    }
                  }}
                  variant="compact"
                />
              </Section>
              {selectedPresetUser && (
                <PresetUserEditor
                  key={selectedPresetUser.presetUserId}
                  presetUser={selectedPresetUser}
                  presetId={presetDetail.presetId}
                  statistics={presetDetail.statistics}
                  tiers={presetDetail.tiers || []}
                  positions={presetDetail.positions || []}
                  onClose={handleClosePresetUserEditor}
                  onRemoveStart={(userId: number) => {
                    setRemovingUserIds((prev) => new Set(prev).add(userId));
                  }}
                  onRemoveError={(userId: number) => {
                    setRemovingUserIds((prev) => {
                      const next = new Set(prev);
                      next.delete(userId);
                      return next;
                    });
                  }}
                />
              )}
            </>
          ) : selectedPresetId && detailLoading ? (
            <Loading />
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
          pointScale={pointScale}
          onPointScaleChange={(value) => setPointScale(parseInt(value) || 1)}
          time={time}
          onTimeChange={(value) => setTime(parseInt(value) || 30)}
          statistics={statistics}
          onStatisticsChange={setStatistics}
          isPending={addPreset.isPending}
          error={addPreset.error}
        />
      </PageContainer>
    </PageLayout>
  );
}
