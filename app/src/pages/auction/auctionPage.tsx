import { useState, useEffect } from "preact/hooks";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { usePresetDetail } from "@/hooks/usePresetApi";
import { TeamList } from "./teamList";
import { InfoCard } from "./infoCard";
import { Section } from "@/components/section";
import { PageLayout, PageContainer } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { UserCard, type UserCardProps } from "@/components/userCard";
import { Input } from "@/components/input";
import { Bar } from "@/components/bar";

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
          <Error>
            유효하지 않은 접근입니다. 경매 참가 링크를 확인해주세요.
          </Error>
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

  const userMap = new Map<number, UserCardProps>(
    presetDetail.preset_users.map((pu) => [
      pu.user_id,
      {
        user_id: pu.user_id,
        name: pu.user.name,
        riot_id: pu.user.riot_id,
        profile_url: pu.user.profile_url,
        tier: pu.tier?.name || null,
        positions: pu.positions.map((p) => p.position.name),
        is_leader: pu.is_leader,
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
      return styles["statusBadge--error"];
    if (status === "in_progress") return styles["statusBadge--active"];
    if (status === "waiting") return styles["statusBadge--waiting"];
    return styles["statusBadge--inactive"];
  };

  return (
    <PageLayout>
      <Section
        variantTone="ghost"
        variantType="secondary"
        className={styles.pageHeader}
      >
        <Section variantTone="ghost" variantLayout="row">
          <h2>경매 상태</h2>
          <span
            className={`${styles.statusBadge} ${getStatusClass(state.status)}`}
          >
            {getStatusText(state.status)}
          </span>
        </Section>
        <Bar />
      </Section>
      <PageContainer>
        <Section variantType="primary" className={styles.teamsSection}>
          <h3>팀 목록</h3>
          <Bar />
          <TeamList teams={state.teams} users={users} pointScale={pointScale} />
        </Section>

        <Section variantType="primary" className={styles.auctionInfoSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>경매 정보</h3>
          </Section>
          <Bar />
          <Section
            variantTone="ghost"
            className={styles.auctionInfoContentSection}
          >
            <Section
              variantType="secondary"
              className={styles.auctionInfoTopSection}
            >
              {state.current_user_id &&
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
                  ) : null;
                })()}
            </Section>

            <Section
              variantTone="ghost"
              className={styles.auctionInfoGridSection}
            >
              <Section variantTone="ghost">
                <InfoCard
                  label="남은 시간"
                  value={state.timer}
                  variant="time"
                />
                <InfoCard
                  label="최고 입찰"
                  value={(state.current_bid || 0) * pointScale}
                  variant="bid"
                />
              </Section>
              <InfoCard label="입찰 팀장" value="">
                {state.current_bidder
                  ? (() => {
                      const bidderTeam = state.teams.find(
                        (t) => t.team_id === state.current_bidder
                      );
                      const leaderUserId = bidderTeam?.leader_id;
                      const bidderLeader = leaderUserId
                        ? userMap.get(leaderUserId)
                        : null;
                      return bidderLeader ? (
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
                      ) : null;
                    })()
                  : null}
              </InfoCard>
            </Section>

            {role === "leader" && !isTeamFull && (
              <Section
                variantTone="ghost"
                variantLayout="row"
                className={styles.auctionInfoBottomSection}
              >
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
        </Section>

        <Section variantTone="ghost" className={styles.queueSection}>
          <Section variantType="primary" className={styles.queueSection}>
            <h3>경매 순서</h3>
            <Bar />
            <Section variantTone="ghost" className={styles.queueGrid}>
              <UserGrid
                users={auctionQueueUsers}
                onUserClick={() => {}}
                variant="compact"
              />
            </Section>
          </Section>

          <Section variantType="primary" className={styles.queueSection}>
            <h3>유찰 목록</h3>
            <Bar />
            <Section variantTone="ghost" className={styles.queueGrid}>
              <UserGrid
                users={unsoldQueueUsers}
                onUserClick={() => {}}
                variant="compact"
              />
            </Section>
          </Section>
        </Section>
      </PageContainer>
    </PageLayout>
  );
}
