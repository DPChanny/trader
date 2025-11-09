import { Player, type PlayerProps } from "./player";
import "./team.css";

interface TeamProps {
  teamName: string;
  points: number;
  captain?: string;
  requiredPositions: string[];
  players: (PlayerProps | null)[];
  playerCount: number;
  onRemovePlayer: (slotIndex: number) => void;
}

export function Team({
  teamName,
  points,
  captain,
  requiredPositions,
  players,
  playerCount,
  onRemovePlayer,
}: TeamProps) {
  return (
    <div class="team-card">
      <div class="team-header">
        <h2 class="team-name">{teamName}</h2>
        <div class="team-info">
          <span class="team-points">포인트: {points}</span>
          {captain && <span class="team-captain">팀장: {captain}</span>}
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
                <Player
                  name={players[index]!.name}
                  photo={players[index]!.photo}
                  position={players[index]!.position}
                  tier={players[index]!.tier}
                />
                <button
                  class="remove-player-btn"
                  onClick={() => onRemovePlayer(index)}
                >
                  제거
                </button>
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
