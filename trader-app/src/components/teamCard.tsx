import { UserCard } from "./userCard";
import type { Team } from "../types";
import "./teamCard.css";

export function TeamCard({
  teamName,
  points,
  captain,
  requiredPositions,
  users,
}: Team) {
  const userCount = users.filter((p) => p !== null).length;

  return (
    <div class="team-card">
      <div class="team-header">
        <h2 class="team-name">{teamName}</h2>
        <div class="team-info">
          <span class="team-points">포인트: {points}</span>
          <span class="team-captain">팀장: {captain.nickname}</span>
          <span class="team-count">
            구성원: {userCount}/{requiredPositions.length}
          </span>
        </div>
      </div>

      <div class="team-users-container">
        {requiredPositions.map((position, index) => (
          <div key={index} class="user-slot">
            <div class="slot-label">{position}</div>
            {users[index] ? (
              <div class="slot-content">
                <UserCard
                  nickname={users[index]!.nickname}
                  riot_nickname={users[index]!.riot_nickname}
                  tier={users[index]!.tier}
                  positions={
                    users[index]!.position ? [users[index]!.position!] : null
                  }
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
