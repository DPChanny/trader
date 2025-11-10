import type { Team } from "@/types";
import { TeamCard } from "@/components/teamCard";
import "./auctionPage.css";

interface AuctionPageProps {
  teams: Team[];
}

export function AuctionPage({ teams }: AuctionPageProps) {
  // TODO: 실제 경매 로직으로 대체
  const remainingTime = 30;
  const highestBid = 0;
  const highestBidder = "";

  return (
    <div class="auction-layout">
      {/* 왼쪽: 팀 리스트 */}
      <div class="auction-left">
        <h2>참가 팀 목록</h2>
        <div class="teams-list">
          {teams.length === 0 ? (
            <p class="empty-message">등록된 팀이 없습니다</p>
          ) : (
            teams.map((team, index) => (
              <div key={index} class="team-item">
                <TeamCard
                  teamName={team.teamName}
                  points={team.points}
                  captain={team.captain}
                  requiredPositions={team.requiredPositions}
                  users={team.users}
                  initialPoints={team.initialPoints}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 가운데: 현재 경매중인 플레이어 */}
      <div class="auction-center">
        <h2>경매 진행</h2>
        <div class="current-auction">
          <p class="placeholder-text">경매가 시작되지 않았습니다</p>
        </div>

        <div class="auction-status">
          <div class="status-item">
            <span class="status-label">남은 시간</span>
            <span class="status-value time">{remainingTime}초</span>
          </div>
          <div class="status-item">
            <span class="status-label">최고 입찰</span>
            <span class="status-value bid">{highestBid} 포인트</span>
          </div>
          <div class="status-item">
            <span class="status-label">입찰 팀</span>
            <span class="status-value team">{highestBidder || "없음"}</span>
          </div>
        </div>
      </div>

      {/* 오른쪽: 경매 순서 & 유찰 리스트 */}
      <div class="auction-right">
        {/* 위: 경매 순서 */}
        <div class="auction-queue">
          <h3>경매 순서</h3>
          <div class="queue-list">
            <p class="placeholder-text">경매 순서가 표시됩니다</p>
          </div>
        </div>

        {/* 아래: 유찰 리스트 */}
        <div class="failed-auction">
          <h3>유찰 목록</h3>
          <div class="failed-list">
            <p class="placeholder-text">유찰된 선수가 표시됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
