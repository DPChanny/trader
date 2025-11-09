import { UserCard } from "./userCard";
import type { Team } from "../types";
import "./teamCard.css";

export function TeamCard({
  teamName,
  points,
  captain,
  requiredPositions,
  players,
}: Team) {
  const playerCount = players.filter((p) => p !== null).length;

  return (
    <div class="team-card">
      <div class="team-header">
        <h2 class="team-name">{teamName}</h2>
        <div class="team-info">
          <span class="team-points">포인트: {points}</span>
          <span class="team-captain">팀장: {captain.nickname}</span>
          <span class="team-count">
            구성원: {playerCount}/{requiredPositions.length}
          </span>
        </div>
      </div>

      <div class="team-players-container">
        {requiredPositions.map((position, index) => (
          <div key={index} class="player-slot">
            <div class="slot-label">{position}</div>
            {players[index] ? (
              <div class="slot-content">
                <UserCard
                  user_id={players[index]!.user_id}
                  nickname={players[index]!.nickname}
                  riot_nickname={players[index]!.riot_nickname}
                  position={players[index]!.position}
                  tier={players[index]!.tier}
                />
              </div>
            ) : (
              <div class="empty-slot">
                <span class="empty-slot-text">빈 슬롯</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
