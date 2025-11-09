import { Player, type PlayerProps } from "./player";
import "./setup.css";

const ALL_POSITIONS = ["골키퍼", "수비수", "미드필더", "포워드"];

export interface SetupSettings {
  requiredPositions: string[];
  initialPoints: number;
  captains: PlayerProps[];
}

interface SetupProps {
  availablePlayers: PlayerProps[];
  requiredPositions: string[];
  setRequiredPositions: (positions: string[]) => void;
  selectedCaptains: PlayerProps[];
  setSelectedCaptains: (captains: PlayerProps[]) => void;
  initialPoints: number;
  setInitialPoints: (points: number) => void;
}

export function Setup({
  availablePlayers,
  requiredPositions,
  setRequiredPositions,
  selectedCaptains,
  setSelectedCaptains,
  initialPoints,
  setInitialPoints,
}: SetupProps) {
  const addPosition = (position: string) => {
    setRequiredPositions([...requiredPositions, position]);
  };

  const removePosition = (index: number) => {
    setRequiredPositions(requiredPositions.filter((_, i) => i !== index));
  };

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
        <label>필요 포지션 (모든 팀 공통):</label>
        <div class="position-buttons">
          {ALL_POSITIONS.map((position) => (
            <button
              key={position}
              class="position-add-btn"
              onClick={() => addPosition(position)}
            >
              {position} 추가
            </button>
          ))}
        </div>
        <div class="selected-positions">
          {requiredPositions.map((position, index) => (
            <div key={index} class="position-tag">
              {position}
              <button
                class="position-remove-btn"
                onClick={() => removePosition(index)}
              >
                ✕
              </button>
            </div>
          ))}
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
