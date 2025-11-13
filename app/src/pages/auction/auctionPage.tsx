import {useEffect, useState} from "preact/hooks";
import {useAuctionWebSocket} from "@/hooks/useAuctionWebSocket";
import {usePresetDetail} from "@/hooks/usePresetApi";
import {TeamList} from "./teamList";
import {InfoCard} from "./infoCard";
import {Section} from "@/components/section";
import {PageContainer, PageLayout} from "@/components/page";
import {Loading} from "@/components/loading";
import {Error} from "@/components/error";
import {PrimaryButton} from "@/components/button";
import {PresetUserGrid} from "@/components/presetUserGrid";
import {PresetUserCard} from "@/components/presetUserCard";
import {Input} from "@/components/input";
import {Bar} from "@/components/bar";
import type {PresetUserDetail} from "@/dtos";

import styles from "@/styles/pages/auction/auctionPage.module.css";

export function AuctionPage() {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const {isConnected, wasConnected, connect, placeBid, state, role, teamId} =
    useAuctionWebSocket();

  const {
    data: presetDetail,
    isLoading: isPresetLoading,
    isFetching: isPresetFetching
  } = usePresetDetail(state?.presetId || null);

  const pointScale = presetDetail?.pointScale || 1;

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

  if (!isConnected || !state) {
    return (
      <PageLayout>
        <PageContainer>
          <Loading/>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!state.presetId) {
    return (
      <PageLayout>
        <PageContainer>
          <Loading/>
        </PageContainer>
      </PageLayout>
    );
  }

  if ((isPresetLoading || isPresetFetching) && !presetDetail) {
    return (
      <PageLayout>
        <PageContainer>
          <Loading/>
        </PageContainer>
      </PageLayout>
    );
  }

  if (!presetDetail) {
    return (
      <PageLayout>
        <PageContainer>
          <Loading/>
        </PageContainer>
      </PageLayout>
    );
  }

  const presetUserMap = new Map<number, PresetUserDetail>(
    presetDetail.presetUsers.map((pu) => [pu.userId, pu])
  );

  const auctionQueueUsers = state.auctionQueue
    .map((userId) => presetUserMap.get(userId))
    .filter((user): user is PresetUserDetail => user !== undefined);

  const unsoldQueueUsers = state.unsoldQueue
    .map((userId) => presetUserMap.get(userId))
    .filter((user): user is PresetUserDetail => user !== undefined);

  const presetUsers: PresetUserDetail[] = Array.from(presetUserMap.values());

  const currentTeam = teamId
    ? state.teams.find((t) => t.teamId === teamId)
    : null;
  const teamMemberCount = currentTeam ? currentTeam.memberIdList.length : 0;
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

  const currentUser = state.currentUserId
    ? presetUserMap.get(state.currentUserId)
    : null;

  const bidderTeam = state.currentBidder
    ? state.teams.find((t) => t.teamId === state.currentBidder)
    : null;
  const leaderUserId = bidderTeam?.leaderId;
  const bidderLeader = leaderUserId ? presetUserMap.get(leaderUserId) : null;

  const handlePlaceBid = () => {
    const displayAmount = parseInt(bidAmount);
    if (displayAmount > 0 && displayAmount % pointScale === 0) {
      const actualAmount = displayAmount / pointScale;
      placeBid(actualAmount);
      setBidAmount("");
    }
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
        <Bar/>
      </Section>
      <PageContainer>
        <Section variantType="primary" className={styles.teamsSection}>
          <h3>팀 목록</h3>
          <Bar/>
          <TeamList teams={state.teams} presetUsers={presetUsers} pointScale={pointScale}/>
        </Section>

        <Section variantType="primary" className={styles.auctionInfoSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>경매 정보</h3>
          </Section>
          <Bar/>
          <Section
            variantTone="ghost"
            className={styles.auctionInfoContentSection}
          >
            <Section
              variantType="secondary"
              className={styles.auctionInfoTopSection}
            >
              {currentUser && (
                <PresetUserCard presetUser={currentUser} variant="compact"/>
              )}
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
                  value={(state.currentBid || 0) * pointScale}
                  variant="bid"
                />
              </Section>
              <InfoCard label="입찰 팀장" value="">
                {bidderLeader && (
                  <PresetUserCard
                    presetUser={bidderLeader}
                    variant="compact"
                  />
                )}
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
                  onClick={handlePlaceBid}
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
            <Bar/>
            <Section variantTone="ghost" className={styles.queueGrid}>
              <PresetUserGrid
                presetUsers={auctionQueueUsers}
                onUserClick={() => {
                }}
                variant="compact"
              />
            </Section>
          </Section>

          <Section variantType="primary" className={styles.queueSection}>
            <h3>유찰 목록</h3>
            <Bar/>
            <Section variantTone="ghost" className={styles.queueGrid}>
              <PresetUserGrid
                presetUsers={unsoldQueueUsers}
                onUserClick={() => {
                }}
                variant="compact"
              />
            </Section>
          </Section>
        </Section>
      </PageContainer>
    </PageLayout>
  );
}
