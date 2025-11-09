import "./app.css";
import { Player, type PlayerProps } from "./components/player";
import { Team } from "./components/team";
import { useTeamState } from "./components/useTeamState";

// 사용 가능한 플레이어 풀
const AVAILABLE_PLAYERS: PlayerProps[] = [
  {
    name: "손흥민",
    photo: "https://via.placeholder.com/200",
    position: "포워드",
    tier: "S",
  },
  {
    name: "이강인",
    photo: "https://via.placeholder.com/200",
    position: "미드필더",
    tier: "A",
  },
  {
    name: "김민재",
    photo: "https://via.placeholder.com/200",
    position: "수비수",
    tier: "A",
  },
  {
    name: "황희찬",
    photo: "https://via.placeholder.com/200",
    position: "포워드",
    tier: "B",
  },
  {
    name: "조현우",
    photo: "https://via.placeholder.com/200",
    position: "골키퍼",
    tier: "S",
  },
  {
    name: "황인범",
    photo: "https://via.placeholder.com/200",
    position: "미드필더",
    tier: "B",
  },
];

const DREAM_TEAM_POSITIONS = [
  "골키퍼",
  "수비수",
  "수비수",
  "미드필더",
  "미드필더",
  "포워드",
];
const CHALLENGERS_POSITIONS = ["골키퍼", "수비수", "미드필더", "포워드"];

export function App() {
  // useTeamState Hook 사용 (초기 포인트 설정)
  const dreamTeam = useTeamState(DREAM_TEAM_POSITIONS, 1250);
  const challengersTeam = useTeamState(CHALLENGERS_POSITIONS, 850);

  // 외부에서 특정 플레이어를 추가하는 함수
  const handleAddPlayerFromPool = (
    teamAddPlayer: (player: PlayerProps, slot: number) => void,
    slotIndex: number
  ) => {
    // 플레이어 풀에서 랜덤으로 선택
    const randomPlayer =
      AVAILABLE_PLAYERS[Math.floor(Math.random() * AVAILABLE_PLAYERS.length)];
    teamAddPlayer(randomPlayer, slotIndex);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Team Card Test</h1>

      {/* 외부에서 플레이어 관리 */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => handleAddPlayerFromPool(dreamTeam.addPlayer, 0)}
        >
          드림팀 골키퍼 슬롯에 추가
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => dreamTeam.addPlayer(AVAILABLE_PLAYERS[0], 5)}
        >
          드림팀에 손흥민 추가 (포워드)
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => dreamTeam.removePlayer(0)}
        >
          드림팀 골키퍼 제거
        </button>
      </div>

      {/* Team 컴포넌트에 상태와 함수 전달 */}
      <Team
        teamName="드림팀 FC"
        points={dreamTeam.points}
        captain="손흥민"
        requiredPositions={DREAM_TEAM_POSITIONS}
        players={dreamTeam.players}
        playerCount={dreamTeam.playerCount}
        onRemovePlayer={dreamTeam.removePlayer}
      />

      <Team
        teamName="챌린저스"
        points={challengersTeam.points}
        requiredPositions={CHALLENGERS_POSITIONS}
        players={challengersTeam.players}
        playerCount={challengersTeam.playerCount}
        onRemovePlayer={challengersTeam.removePlayer}
      />

      <hr style={{ margin: "40px 0", border: "1px solid #ddd" }} />

      <h1>사용 가능한 플레이어 풀</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        {AVAILABLE_PLAYERS.map((player, index) => (
          <Player
            key={index}
            name={player.name}
            photo={player.photo}
            position={player.position}
            tier={player.tier}
          />
        ))}
      </div>
    </div>
  );
}
