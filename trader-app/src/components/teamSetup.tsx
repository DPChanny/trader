import { useState } from "preact/hooks";
import type { PlayerProps } from "./player";
import "./teamSetup.css";

const ALL_POSITIONS = ["골키퍼", "수비수", "미드필더", "포워드"];

export interface CommonTeamSettings {
  requiredPositions: string[];
  initialPoints: number;
  captains: PlayerProps[];
}

interface TeamSetupProps {
  availablePlayers: PlayerProps[];
  onComplete: (settings: CommonTeamSettings) => void;
}

export function TeamSetup({ availablePlayers, onComplete }: TeamSetupProps) {
  const [requiredPositions, setRequiredPositions] = useState<string[]>([]);
  const [selectedCaptains, setSelectedCaptains] = useState<PlayerProps[]>([]);
  const [initialPoints, setInitialPoints] = useState(1000);

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

  const handleSubmit = () => {
    if (requiredPositions.length === 0) {
      alert("최소 하나의 포지션을 추가하세요");
      return;
    }
    if (selectedCaptains.length === 0) {
      alert("최소 한 명의 팀장을 선택하세요");
      return;
    }

    onComplete({
      requiredPositions,
      initialPoints,
      captains: selectedCaptains,
    });

    // 초기화
    setRequiredPositions([]);
    setSelectedCaptains([]);
    setInitialPoints(1000);
  };

  return (
    <div class="team-setup">
      <h3>팀 설정 (공통)</h3>

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
          팀 생성
        </div>
        <div class="captain-selection">
          {availablePlayers.map((player, index) => {
            const isSelected = selectedCaptains.some(
              (c) => c.name === player.name
            );
            return (
              <div
                key={index}
                class={`captain-option ${isSelected ? "selected" : ""}`}
                onClick={() => toggleCaptain(player)}
              >
                <img src={player.photo} alt={player.name} />
                <div class="captain-info">
                  <div class="captain-name">{player.name}</div>
                  <div class="captain-details">
                    {player.position} · {player.tier}
                  </div>
                </div>
                {isSelected && <div class="selected-badge">✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      <button class="submit-team-btn" onClick={handleSubmit}>
        {selectedCaptains.length}개 팀 생성
      </button>
    </div>
  );
}
