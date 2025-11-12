import { useState, useEffect } from "preact/hooks";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { usePresetDetail } from "@/hooks/usePresetApi";
import { TeamList } from "./teamList";
import { Section } from "@/components/section";
import { PageLayout, PageContainer, PageHeader } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { UserCard, type UserCardProps } from "@/components/userCard";
import { Input } from "@/components/input";

import auctionCardStyles from "@/styles/pages/auction/auctionCard.module.css";
import styles from "@/styles/pages/auction/auctionPage.module.css";

export function AuctionPage() {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const { isConnected, wasConnected, connect, placeBid, state, role, teamId } =
    useAuctionWebSocket();

  const { data: presetDetail } = usePresetDetail(state?.preset_id || null);

  const pointScale = presetDetail?.point_scale || 1;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setToken(token);
      connect(token);
    }
  }, []);

  if (!token) {
    return (
      <PageLayout>
        <PageContainer>
          <Section variantType="primary">
            <Error>
              유효하지 않은 접근입니다. 경매 참가 링크를 확인해주세요.
            </Error>
          </Section>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!isConnected || !state || !presetDetail) {
    return (
      <PageLayout>
        <PageContainer>
          <Loading />
        </PageContainer>
      </PageLayout>
    );
  }

  const presetLeaderIds = new Set(
    presetDetail.preset_leaders.map((pl) => pl.user_id)
  );

  const userMap = new Map<number, UserCardProps>(
    presetDetail.preset_users.map((pu) => [
      pu.user_id,
      {
        user_id: pu.user_id,
        name: pu.user.name,
        riot_id: pu.user.riot_id,
        profile_url: pu.user.profile_url,
        tier: pu.tier?.name || null,
        positions: pu.positions.map((p) => p.name),
        is_leader: presetLeaderIds.has(pu.user_id),
      },
    ])
  );

  const auctionQueueUsers = state.auction_queue
    .map((userId) => userMap.get(userId))
    .filter((user): user is UserCardProps => user !== undefined);

  const unsoldQueueUsers = state.unsold_queue
    .map((userId) => userMap.get(userId))
    .filter((user): user is UserCardProps => user !== undefined);

  const users: UserCardProps[] = Array.from(userMap.values());

  const currentTeam = teamId
    ? state.teams.find((t) => t.team_id === teamId)
    : null;
  const teamMemberCount = currentTeam ? currentTeam.member_id_list.length : 0;
  const isTeamFull = teamMemberCount >= 5;

  const getStatusText = (status: string) => {
    if (wasConnected && !isConnected && status !== "completed")
      return "연결 끊김";
    if (status === "waiting") return "접속 대기 중";
    if (status === "in_progress") return "경매 진행 중";
    if (status === "completed") return "경매 완료";
    return status;
  };

  const getStatusClass = (status: string) => {
    if (wasConnected && !isConnected && status !== "completed")
      return auctionCardStyles["statusBadge--error"];
    if (status === "in_progress")
      return auctionCardStyles["statusBadge--active"];
    if (status === "waiting") return auctionCardStyles["statusBadge--waiting"];
    return auctionCardStyles["statusBadge--inactive"];
  };

  return (
    <PageLayout>
      <PageHeader title="경매 진행">
        <span
          className={`${auctionCardStyles.statusBadge} ${getStatusClass(
            state.status
          )}`}
        >
          {getStatusText(state.status)}
        </span>
      </PageHeader>
      <PageContainer className={styles.auctionPageContainer}>
        <div className={styles.auctionDetailLayout}>
          <Section variantType="primary" className={styles.teamsSection}>
            <h3 className={styles.sectionTitle}>팀 목록</h3>
            <TeamList
              teams={state.teams}
              users={users}
              pointScale={pointScale}
            />
          </Section>
          <Section variantType="primary" className={styles.auctionInfoSection}>
            <h3
              className={`text-white text-xl font-semibold m-0 ${styles.auctionInfoTitle}`}
            >
              경매 정보
            </h3>
            <Section
              variantType="invisible"
              className={styles.auctionInfoContent}
            >
              <Section
                variantType="secondary"
                className={styles.currentAuction}
              >
                {state.current_user_id ? (
                  (() => {
                    const currentUser = userMap.get(state.current_user_id);
                    return currentUser ? (
                      <UserCard
                        user_id={currentUser.user_id}
                        name={currentUser.name}
                        riot_id={currentUser.riot_id}
                        profile_url={currentUser.profile_url}
                        tier={currentUser.tier}
                        positions={currentUser.positions}
                        is_leader={currentUser.is_leader}
                        variant="compact"
                      />
                    ) : (
                      <div>유저 정보 없음</div>
                    );
                  })()
                ) : (
                  <div />
                )}
              </Section>
              <Section
                variantType="invisible"
                className={styles.auctionInfoGrid}
              >
                <Section
                  variantType="secondary"
                  className={styles.timerSection}
                >
                  <span className={styles.statusLabel}>남은 시간</span>
                  <span className={`${styles.statusValue} ${styles.time}`}>
                    {state.timer}
                  </span>
                </Section>
                <Section
                  variantType="secondary"
                  className={styles.bidAmountSection}
                >
                  <span className={styles.statusLabel}>최고 입찰</span>
                  <span className={`${styles.statusValue} ${styles.bid}`}>
                    {(state.current_bid || 0) * pointScale}
                  </span>
                </Section>
                <Section
                  variantType="secondary"
                  className={styles.bidderSection}
                >
                  <span className={styles.statusLabel}>입찰 팀장</span>
                  {state.current_bidder ? (
                    (() => {
                      const bidderTeam = state.teams.find(
                        (t) => t.team_id === state.current_bidder
                      );
                      const leaderUserId = bidderTeam?.leader_id;
                      const bidderLeader = leaderUserId
                        ? userMap.get(leaderUserId)
                        : null;
                      return bidderLeader ? (
                        <div className={styles.bidderCard}>
                          <UserCard
                            user_id={bidderLeader.user_id}
                            name={bidderLeader.name}
                            riot_id={bidderLeader.riot_id}
                            profile_url={bidderLeader.profile_url}
                            tier={bidderLeader.tier}
                            positions={bidderLeader.positions}
                            is_leader={bidderLeader.is_leader}
                            variant="compact"
                          />
                        </div>
                      ) : (
                        <span className={styles.statusValue}>없음</span>
                      );
                    })()
                  ) : (
                    <span className={styles.statusValue}>없음</span>
                  )}
                </Section>
              </Section>
            </Section>
            {role === "leader" && !isTeamFull && (
              <Section variantType="invisible" className={styles.bidControls}>
                <Input
                  type="number"
                  placeholder={`입찰 금액 (${pointScale}의 배수)`}
                  value={bidAmount}
                  onChange={(value) => setBidAmount(value)}
                  disabled={state.status !== "in_progress"}
                />
                <PrimaryButton
                  onClick={() => {
                    const displayAmount = parseInt(bidAmount);
                    if (displayAmount > 0 && displayAmount % pointScale === 0) {
                      const actualAmount = displayAmount / pointScale;
                      placeBid(actualAmount);
                      setBidAmount("");
                    }
                  }}
                  disabled={
                    state.status !== "in_progress" ||
                    !bidAmount ||
                    parseInt(bidAmount) <= 0 ||
                    parseInt(bidAmount) % pointScale !== 0
                  }
                >
                  입찰하기
                </PrimaryButton>
              </Section>
            )}
          </Section>
          <div className={styles.auctionQueuesSection}>
            <Section variantType="primary" className={styles.gridSection}>
              <h3 className={styles.sectionTitle}>경매 순서</h3>
              <UserGrid
                users={auctionQueueUsers}
                onUserClick={() => {}}
                variant="compact"
              />
            </Section>
            <Section variantType="primary" className={styles.gridSection}>
              <h3 className={styles.sectionTitle}>유찰 목록</h3>
              <UserGrid
                users={unsoldQueueUsers}
                onUserClick={() => {}}
                variant="compact"
              />
            </Section>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
