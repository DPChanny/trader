import { useState } from "preact/hooks";
import { useGetAuctions, useGetAuctionDetail } from "@/hooks/useAuctionApi";
import { usePresetDetail } from "@/hooks/usePresetApi";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { AuctionList } from "./auctionList";
import { TeamList } from "./teamList";
import { AccessCodeModal } from "./accessCodeModal";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { UserCard } from "@/components/userCard";
import { Input } from "@/components/input";

import styles from "@/styles/pages/auction/auctionPage.module.css";

export function AuctionPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const {
    joinAsObserver,
    joinAsLeader,
    auctionState,
    placeBid,
    isLeader,
    myTeamId,
  } = useAuctionWebSocket();
  const {
    data: auctionsData,
    isLoading: isLoadingList,
    error: listError,
  } = useGetAuctions();
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useGetAuctionDetail(selectedSessionId);

  const auctions = auctionsData?.data || [];

  // WebSocket 상태가 있으면 우선 사용, 없으면 API 데이터 사용
  const auctionDetail = auctionState || detailData?.data;

  // Get preset_id from selected auction
  const selectedAuction = auctions.find(
    (a) => a.session_id === selectedSessionId
  );
  const presetId = selectedAuction?.preset_id || null;

  // Fetch preset details to get user information
  const { data: presetDetail, isLoading: isLoadingPreset } =
    usePresetDetail(presetId);

  // WebSocket 참가 핸들러
  const handleJoinAsObserver = (sessionId: string) => {
    console.log("Joining as observer:", sessionId);
    joinAsObserver(sessionId);
    setSelectedSessionId(sessionId);
  };

  const handleJoinAsLeader = (sessionId: string) => {
    console.log("Opening leader access modal for:", sessionId);
    setPendingSessionId(sessionId);
    setIsLeaderModalOpen(true);
  };

  const handleLeaderAccessSubmit = (accessCode: string) => {
    if (pendingSessionId) {
      console.log("Joining as leader with access code:", accessCode);
      joinAsLeader(pendingSessionId, accessCode);
      setSelectedSessionId(pendingSessionId);
      setPendingSessionId(null);
    }
  };

  // 경매 리스트 화면
  if (!selectedSessionId) {
    return (
      <div className={styles.auctionPage}>
        <div className={styles.auctionContainer}>
          <Section variant="primary" className={styles.auctionListContainer}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-2xl font-semibold m-0">
                경매 목록
              </h2>
            </div>
            <Bar variantColor="blue" />
            {listError && <Error>경매 리스트를 불러오는데 실패했습니다.</Error>}
            {!listError && (
              <AuctionList
                auctions={auctions}
                onJoinAsObserver={handleJoinAsObserver}
                onJoinAsLeader={handleJoinAsLeader}
                isLoading={isLoadingList}
              />
            )}
          </Section>
        </div>
        <AccessCodeModal
          isOpen={isLeaderModalOpen}
          onClose={() => setIsLeaderModalOpen(false)}
          onSubmit={handleLeaderAccessSubmit}
          sessionId={pendingSessionId || ""}
        />
      </div>
    );
  }

  // 경매 상세 화면
  if (isLoadingDetail || isLoadingPreset) return <Loading />;
  if (detailError) return <Error>경매 정보를 불러오지 못했습니다.</Error>;
  if (!auctionDetail) return <Error>경매를 찾을 수 없습니다.</Error>;
  if (!presetDetail) return <Error>프리셋 정보를 불러오지 못했습니다.</Error>;

  // Map user IDs to full user details from preset
  const userMap = new Map(
    presetDetail.preset_users.map((pu) => [
      pu.user_id,
      {
        id: pu.preset_user_id,
        nickname: pu.user.nickname,
        riot_nickname: pu.user.riot_nickname,
        tier: pu.tier?.name || null,
        positions: pu.positions?.map((p) => p.name) || [],
        is_leader: presetDetail.leaders.some((l) => l.user_id === pu.user_id),
      },
    ])
  );

  // Convert auction queue and unsold queue to user items
  const auctionQueueUsers = auctionDetail.auction_queue
    .map((userId) => userMap.get(userId))
    .filter((user) => user !== undefined);

  const unsoldQueueUsers = auctionDetail.unsold_queue
    .map((userId) => userMap.get(userId))
    .filter((user) => user !== undefined);

  // Convert all preset users to team members format
  const allMembers = presetDetail.preset_users.map((pu) => ({
    user_id: pu.user_id,
    nickname: pu.user.nickname,
    riot_nickname: pu.user.riot_nickname,
    tier: pu.tier?.name || null,
    positions: pu.positions?.map((p) => p.name) || [],
    is_leader: presetDetail.leaders.some((l) => l.user_id === pu.user_id),
  }));

  return (
    <div className={styles.auctionPage}>
      <div className={styles.auctionContainer}>
        <div className="flex justify-between items-center mb-4">
          <PrimaryButton onClick={() => setSelectedSessionId(null)}>
            ← 목록으로
          </PrimaryButton>
          <h2 className="text-white text-2xl font-semibold m-0">
            경매 진행 중
          </h2>
        </div>
        <Bar variantColor="blue" />

        <div className={styles.auctionDetailLayout}>
          {/* 왼쪽: 팀 목록 */}
          <Section variant="primary" className={styles.teamsSection}>
            <h3 className="text-white text-xl font-semibold m-0 mb-5">
              팀 목록
            </h3>
            <TeamList
              teams={auctionDetail.teams}
              allMembers={allMembers}
              myTeamId={myTeamId}
            />
          </Section>

          {/* 가운데: 현재 경매 정보 */}
          <Section variant="primary" className={styles.auctionInfoSection}>
            <h3 className="text-white text-xl font-semibold m-0 mb-5">
              경매 정보
            </h3>
            <Section variant="secondary" className={styles.currentAuction}>
              {auctionDetail.current_user_id ? (
                (() => {
                  const currentUser = userMap.get(
                    auctionDetail.current_user_id
                  );
                  return currentUser ? (
                    <UserCard
                      nickname={currentUser.nickname}
                      riot_nickname={currentUser.riot_nickname}
                      tier={currentUser.tier}
                      positions={currentUser.positions}
                      is_leader={currentUser.is_leader}
                    />
                  ) : (
                    <div>유저 정보 없음</div>
                  );
                })()
              ) : (
                <div>경매 대기 중...</div>
              )}
            </Section>

            <div className={styles.auctionStatus}>
              <Section variant="secondary" className={styles.statusItem}>
                <span className={styles.statusLabel}>남은 시간</span>
                <span className={`${styles.statusValue} ${styles.time}`}>
                  {auctionDetail.timer}초
                </span>
              </Section>
              <Section variant="secondary" className={styles.statusItem}>
                <span className={styles.statusLabel}>최고 입찰</span>
                <span className={`${styles.statusValue} ${styles.bid}`}>
                  {auctionDetail.current_bid || 0} 포인트
                </span>
              </Section>
              <Section variant="secondary" className={styles.statusItem}>
                <span className={styles.statusLabel}>입찰 팀</span>
                <span className={`${styles.statusValue} ${styles.team}`}>
                  {auctionDetail.current_bidder
                    ? `Team ${auctionDetail.current_bidder}`
                    : "없음"}
                </span>
              </Section>
            </div>

            {/* 입찰 UI - 리더인 경우 표시 */}
            {isLeader && (
              <div className={styles.bidControls}>
                <Input
                  type="number"
                  placeholder="입찰 금액"
                  value={bidAmount}
                  onChange={(value) => setBidAmount(value)}
                  disabled={!auctionDetail.current_user_id}
                />
                <PrimaryButton
                  onClick={() => {
                    const amount = parseInt(bidAmount);
                    if (amount > 0) {
                      placeBid(amount);
                      setBidAmount("");
                    }
                  }}
                  disabled={
                    !auctionDetail.current_user_id ||
                    !bidAmount ||
                    parseInt(bidAmount) <= 0
                  }
                >
                  입찰하기
                </PrimaryButton>
              </div>
            )}
          </Section>

          {/* 오른쪽: 경매 순서 + 유찰 목록 (상하 분할) */}
          <div className={styles.auctionQueuesSection}>
            {/* 경매 순서 */}
            <Section variant="primary" className={styles.gridSection}>
              <h3 className="text-white text-xl font-semibold m-0 mb-5">
                경매 순서 ({auctionQueueUsers.length}명)
              </h3>
              <UserGrid users={auctionQueueUsers} onUserClick={() => {}} />
            </Section>

            {/* 유찰 목록 */}
            <Section variant="primary" className={styles.gridSection}>
              <h3 className="text-white text-xl font-semibold m-0 mb-5">
                유찰 목록 ({unsoldQueueUsers.length}명)
              </h3>
              <UserGrid users={unsoldQueueUsers} onUserClick={() => {}} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
