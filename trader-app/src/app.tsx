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

export function App() {
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [teams, setTeams] = useState<TeamState[]>([]);

  // Setup 설정 상태
  const [requiredPositions, setRequiredPositions] = useState<string[]>([]);
  const [selectedCaptains, setSelectedCaptains] = useState<PlayerProps[]>([]);
  const [initialPoints, setInitialPoints] = useState(1000);

  const handleStartAuction = () => {
    // 유효성 검사
    if (requiredPositions.length === 0) {
      alert("최소 하나의 포지션을 추가하세요");
      return;
    }
    if (selectedCaptains.length === 0) {
      alert("최소 한 명의 팀장을 선택하세요");
      return;
    }

    // 팀 생성
    const newTeams = selectedCaptains.map((captain) => {
      // 빈 슬롯 배열 생성
      const emptyPlayers = Array(requiredPositions.length).fill(null);

      // 팀장을 해당 포지션 슬롯에 자동 추가
      const captainSlotIndex = requiredPositions.findIndex(
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
        requiredPositions: requiredPositions,
        initialPoints: initialPoints,
        players: emptyPlayers,
        points: initialPoints,
      };
    });

    setTeams(newTeams);
    setIsAuctionStarted(true);
  };

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

  const handleResetAuction = () => {
    setIsAuctionStarted(false);
    setTeams([]);
  };

  const handleAddPlayer = (
    teamIndex: number,
    player: PlayerProps,
    slotIndex: number
  ) => {
    setTeams(
      teams.map((team, idx) => {
        if (idx !== teamIndex) return team;

        const newPlayers = [...team.players];
        if (newPlayers[slotIndex] === null) {
          newPlayers[slotIndex] = player;
        }

        return { ...team, players: newPlayers };
      })
    );
  };

  const handleRemovePlayer = (teamIndex: number, slotIndex: number) => {
    setTeams(
      teams.map((team, idx) => {
        if (idx !== teamIndex) return team;

        const newPlayers = [...team.players];
        newPlayers[slotIndex] = null;

        return { ...team, players: newPlayers };
      })
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>플레이어 경매 시스템</h1>

      {!isAuctionStarted ? (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <Setup
              availablePlayers={AVAILABLE_PLAYERS}
              requiredPositions={requiredPositions}
              setRequiredPositions={setRequiredPositions}
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
        <div>
          <div style={{ marginBottom: "20px" }}>
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
            teams={teams.map((team, idx) => ({
              teamName: team.teamName,
              requiredPositions: team.requiredPositions,
              captain: team.captain,
              initialPoints: team.initialPoints,
              players: team.players,
              points: team.points,
              playerCount: team.players.filter((p) => p !== null).length,
              addPlayer: (player: PlayerProps, slotIndex: number) =>
                handleAddPlayer(idx, player, slotIndex),
              removePlayer: (slotIndex: number) =>
                handleRemovePlayer(idx, slotIndex),
            }))}
            onRemoveTeam={handleRemoveTeam}
          />
        </div>
      )}
    </div>
  );
}
