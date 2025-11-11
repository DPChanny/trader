import { useState, useEffect } from "preact/hooks";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { useUsers } from "@/hooks/useUserApi";
import { TeamList } from "./teamList";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { UserCard } from "@/components/userCard";
import { Input } from "@/components/input";
import type { Member } from "@/types";

import auctionCardStyles from "@/styles/pages/auction/auctionCard.module.css";
import styles from "@/styles/pages/auction/auctionPage.module.css";

export function AuctionPage() {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const { isConnected, connect, placeBid, state, role } = useAuctionWebSocket();

  const { data: usersData } = useUsers();

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
      <div className={styles.auctionPage}>
        <div className={styles.auctionContainer}>
          <Section variant="primary">
            <Error>
              유효하지 않은 접근입니다. 경매 참가 링크를 확인해주세요.
            </Error>
          </Section>
        </div>
      </div>
    );
  }

  if (!isConnected || !state) {
    return <Loading />;
  }

  const users = usersData?.data || [];
  const userMap = new Map(
    users.map((user) => [
      user.user_id,
      {
        id: user.user_id,
        name: user.name,
        riot_id: user.riot_id,
        tier: null,
        positions: [],
        is_leader: false,
      },
    ])
  );

  const auctionQueueUsers = state.auction_queue
    .map((userId) => userMap.get(userId))
    .filter((user) => user !== undefined);

  const unsoldQueueUsers = state.unsold_queue
    .map((userId) => userMap.get(userId))
    .filter((user) => user !== undefined);

  const allMembers: Member[] = users.map((user) => ({
    user_id: user.user_id,
    name: user.name,
    riot_id: user.riot_id,
    discord_id: user.discord_id,
    tier: null,
    positions: [],
    is_leader: false,
  }));

  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "waiting") return "접속 대기 중";
    if (statusLower === "in_progress") return "경매 진행 중";
    if (statusLower === "completed") return "경매 완료";
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "in_progress")
      return auctionCardStyles["statusBadge--active"];
    if (statusLower === "waiting")
      return auctionCardStyles["statusBadge--waiting"];
    return auctionCardStyles["statusBadge--inactive"];
  };

  return (
    <div className={styles.auctionPage}>
      <div className={styles.auctionContainer}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-2xl font-semibold m-0">경매 진행</h2>
          <span
            className={`${auctionCardStyles.statusBadge} ${getStatusBadgeClass(
              state.status
            )}`}
          >
            {getStatusText(state.status)}
          </span>
        </div>
        <Bar variantColor="blue" />

        <div className={styles.auctionDetailLayout}>
          <Section variant="primary" className={styles.teamsSection}>
            <h3 className="text-white text-xl font-semibold m-0">팀 목록</h3>
            <TeamList teams={state.teams} allMembers={allMembers} />
          </Section>
          <Section variant="primary" className={styles.auctionInfoSection}>
            <h3 className="text-white text-xl font-semibold m-0">경매 정보</h3>
            <Section variant="secondary" className={styles.currentAuction}>
              {state.current_user_id ? (
                (() => {
                  const currentUser = userMap.get(state.current_user_id);
                  return currentUser ? (
                    <UserCard
                      name={currentUser.name}
                      riot_id={currentUser.riot_id}
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
            <Section variant="secondary" className={styles.timerSection}>
              <span className={styles.statusLabel}>남은 시간</span>
              <span className={`${styles.statusValue} ${styles.time}`}>
                {state.status.toLowerCase() === "waiting" ? 0 : state.timer}
              </span>
            </Section>
            <div className={styles.bidInfoSection}>
              <Section variant="secondary" className={styles.bidAmountSection}>
                <span className={styles.statusLabel}>최고 입찰</span>
                <span className={`${styles.statusValue} ${styles.bid}`}>
                  {state.current_bid || 0}
                </span>
              </Section>
              <Section variant="secondary" className={styles.bidderSection}>
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
                          name={bidderLeader.name}
                          riot_id={bidderLeader.riot_id}
                          tier={bidderLeader.tier}
                          positions={bidderLeader.positions}
                          is_leader={bidderLeader.is_leader}
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
            </div>
            {role === "leader" && (
              <div className={styles.bidControls}>
                <Input
                  type="number"
                  placeholder="입찰 금액"
                  value={bidAmount}
                  onChange={(value) => setBidAmount(value)}
                  disabled={!state.current_user_id}
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
                    !state.current_user_id ||
                    !bidAmount ||
                    parseInt(bidAmount) <= 0
                  }
                >
                  입찰하기
                </PrimaryButton>
              </div>
            )}
          </Section>
          <div className={styles.auctionQueuesSection}>
            <Section variant="primary" className={styles.gridSection}>
              <h3 className="text-white text-xl font-semibold m-0">
                경매 순서
              </h3>
              <UserGrid users={auctionQueueUsers} onUserClick={() => {}} />
            </Section>
            <Section variant="primary" className={styles.gridSection}>
              <h3 className="text-white text-xl font-semibold m-0">
                유찰 목록
              </h3>
              <UserGrid users={unsoldQueueUsers} onUserClick={() => {}} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
