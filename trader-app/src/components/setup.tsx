import { UserCard } from "./userCard";
import type { User } from "../types";
import "./setup.css";

export interface SetupSettings {
  requiredPositions: string[];
  initialPoints: number;
  captains: User[];
}

interface SetupProps {
  availableUsers: User[];
  selectedCaptains: User[];
  setSelectedCaptains: (captains: User[]) => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export function Setup({
  availableUsers,
  selectedCaptains,
  setSelectedCaptains,
  initialPoints,
  setInitialPoints,
}: SetupProps) {
  const toggleCaptain = (user: User) => {
    const isSelected = selectedCaptains.some((c) => c.user_id === user.user_id);
    if (isSelected) {
      setSelectedCaptains(
        selectedCaptains.filter((c) => c.user_id !== user.user_id)
      );
    } else {
      setSelectedCaptains([...selectedCaptains, user]);
    }
  };

  return (
    <div class="team-setup">
      <h3>경매 설정</h3>

      <div class="setup-field">
        <label>초기 포인트 (모든 팀 공통):</label>
        <input
          type="number"
          value={initialPoints}
          onInput={(e) =>
            setInitialPoints(
              parseInt((e.target as HTMLInputElement).value) || 0
            )
          }
        />
      </div>

      <div class="setup-field">
        <label>팀 구성:</label>
        <div class="info-text">
          모든 팀은 TOP, JUG, MID, SUP, BOT 포지션을 각 1명씩 가집니다.
        </div>
      </div>

      <div class="setup-field">
        <label>팀장 선택 (선택한 수만큼 팀 생성):</label>
        <div class="info-text">
          선택된 팀장: {selectedCaptains.length}명 → {selectedCaptains.length}개
          팀 생성 예정
        </div>
        <div class="captain-selection">
          {availableUsers.map((user) => {
            const isSelected = selectedCaptains.some(
              (c) => c.user_id === user.user_id
            );
            return (
              <div
                key={user.user_id}
                class={`captain-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleCaptain(user)}
              >
                <UserCard
                  user_id={user.user_id}
                  nickname={user.nickname}
                  riot_nickname={user.riot_nickname}
                  position={user.position}
                  tier={user.tier}
                />
                {isSelected && <div class="selected-badge">✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
