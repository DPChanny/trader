import { useState } from "preact/hooks";
import "./app.css";
import type { PlayerProps } from "./components/player";
import { Setup } from "./components/setup";
import { Auction } from "./components/auction";

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

interface TeamState {
  teamName: string;
  captain: PlayerProps;
  requiredPositions: string[];
  initialPoints: number;
  players: (PlayerProps | null)[];
  points: number;
}

const FIXED_POSITIONS = ["TOP", "JUG", "MID", "SUP", "BOT"];

export function App() {
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [teams, setTeams] = useState<TeamState[]>([]);

  // Setup 설정 상태
  const [selectedCaptains, setSelectedCaptains] = useState<PlayerProps[]>([]);
  const [initialPoints, setInitialPoints] = useState(1000);

  const handleStartAuction = () => {
    // 유효성 검사
    if (selectedCaptains.length === 0) {
      alert("최소 한 명의 팀장을 선택하세요");
      return;
    }

    // 팀 생성
    const newTeams = selectedCaptains.map((captain) => {
      // 빈 슬롯 배열 생성 (TOP, JUG, MID, SUP, BOT)
      const emptyPlayers = Array(FIXED_POSITIONS.length).fill(null);

      // 팀장을 해당 포지션 슬롯에 자동 추가
      const captainSlotIndex = FIXED_POSITIONS.findIndex(
        (pos) => pos === captain.position
      );

      if (captainSlotIndex !== -1) {
        emptyPlayers[captainSlotIndex] = captain;
      } else {
        emptyPlayers[0] = captain;
      }

      return {
        teamName: `${captain.name} 팀`,
        captain: captain,
        requiredPositions: FIXED_POSITIONS,
        initialPoints: initialPoints,
        players: emptyPlayers,
        points: initialPoints,
      };
    });

    setTeams(newTeams);
    setIsAuctionStarted(true);
  };

  const handleResetAuction = () => {
    setIsAuctionStarted(false);
    setTeams([]);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h1>플레이어 경매 시스템</h1>

      {!isAuctionStarted ? (
        <div
          style={{
            padding: "0 20px 20px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <Setup
              availablePlayers={AVAILABLE_PLAYERS}
              selectedCaptains={selectedCaptains}
              setSelectedCaptains={setSelectedCaptains}
              initialPoints={initialPoints}
              setInitialPoints={setInitialPoints}
            />
          </div>

          <button
            style={{
              padding: "16px 32px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
            }}
            onClick={handleStartAuction}
          >
            경매 시작 ({selectedCaptains.length}개 팀 생성)
          </button>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              flexShrink: 0,
            }}
          >
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={handleResetAuction}
            >
              경매 초기화
            </button>
          </div>

          <Auction
            teams={teams.map((team) => ({
              teamName: team.teamName,
              requiredPositions: team.requiredPositions,
              captain: team.captain,
              initialPoints: team.initialPoints,
              players: team.players,
              points: team.points,
              playerCount: team.players.filter((p) => p !== null).length,
              addPlayer: () => {},
              removePlayer: () => {},
            }))}
          />
        </div>
      )}
    </div>
  );
}
