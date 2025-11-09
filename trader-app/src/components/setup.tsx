import { Player, type PlayerProps } from "./player";
import "./setup.css";

export interface SetupSettings {
  requiredPositions: string[];
  initialPoints: number;
  captains: PlayerProps[];
}

interface SetupProps {
  availablePlayers: PlayerProps[];
  selectedCaptains: PlayerProps[];
  setSelectedCaptains: (captains: PlayerProps[]) => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export function Setup({
  availablePlayers,
  selectedCaptains,
  setSelectedCaptains,
  initialPoints,
  setInitialPoints,
}: SetupProps) {
  const toggleCaptain = (player: PlayerProps) => {
    const isSelected = selectedCaptains.some((c) => c.name === player.name);
    if (isSelected) {
      setSelectedCaptains(
        selectedCaptains.filter((c) => c.name !== player.name)
      );
    } else {
      setSelectedCaptains([...selectedCaptains, player]);
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
          {availablePlayers.map((player, index) => {
            const isSelected = selectedCaptains.some(
              (c) => c.name === player.name
            );
            return (
              <div
                key={index}
                class={`captain-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleCaptain(player)}
              >
                <Player
                  name={player.name}
                  photo={player.photo}
                  position={player.position}
                  tier={player.tier}
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
