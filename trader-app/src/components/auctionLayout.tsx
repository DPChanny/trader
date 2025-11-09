import type { PlayerProps } from "./player";
import { Team } from "./team";
import "./auctionLayout.css";

interface TeamData {
  teamName: string;
  requiredPositions: string[];
  captain: PlayerProps;
  initialPoints: number;
  players: (PlayerProps | null)[];
  points: number;
  playerCount: number;
  addPlayer: (player: PlayerProps, slot: number) => void;
  removePlayer: (slot: number) => void;
}

interface AuctionLayoutProps {
  teams: TeamData[];
  onRemoveTeam: (index: number) => void;
}

export function AuctionLayout({ teams, onRemoveTeam }: AuctionLayoutProps) {
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
                <Team
                  teamName={team.teamName}
                  points={team.points}
                  captain={team.captain.name}
                  requiredPositions={team.requiredPositions}
                  players={team.players}
                  playerCount={team.playerCount}
                  onRemovePlayer={team.removePlayer}
                />
                <button
                  class="remove-team-btn"
                  onClick={() => onRemoveTeam(index)}
                >
                  팀 제거
                </button>
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
