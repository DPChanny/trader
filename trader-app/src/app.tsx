import { useState } from "preact/hooks";
import "./app.css";
import type { PlayerProps } from "./components/player";
import { useTeamState } from "./components/useTeamState";
import { TeamSetup, type CommonTeamSettings } from "./components/teamSetup";
import { AuctionLayout } from "./components/auctionLayout";

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

interface TeamData {
  teamName: string;
  captain: PlayerProps;
  requiredPositions: string[];
  initialPoints: number;
}

export function App() {
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [teams, setTeams] = useState<
    Array<{ data: TeamData; hook: ReturnType<typeof useTeamState> }>
  >([]);

  const handleCreateTeams = (settings: CommonTeamSettings) => {
    const newTeams = settings.captains.map((captain) => {
      const teamHook = useTeamState(
        settings.requiredPositions,
        settings.initialPoints
      );

      // 팀장을 해당 포지션 슬롯에 자동 추가
      const captainSlotIndex = settings.requiredPositions.findIndex(
        (pos) => pos === captain.position
      );

      if (captainSlotIndex !== -1) {
        teamHook.addPlayer(captain, captainSlotIndex);
      } else {
        teamHook.addPlayer(captain, 0);
      }

      return {
        data: {
          teamName: `${captain.name} 팀`,
          captain: captain,
          requiredPositions: settings.requiredPositions,
          initialPoints: settings.initialPoints,
        },
        hook: teamHook,
      };
    });

    setTeams(newTeams);
  };

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

  const handleStartAuction = () => {
    if (teams.length === 0) {
      alert("최소 1개의 팀을 등록해주세요");
      return;
    }
    setIsAuctionStarted(true);
  };

  const handleResetAuction = () => {
    setIsAuctionStarted(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>플레이어 경매 시스템</h1>

      {!isAuctionStarted ? (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <TeamSetup
              availablePlayers={AVAILABLE_PLAYERS}
              onComplete={handleCreateTeams}
            />
          </div>

          {teams.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>등록된 팀 ({teams.length})</h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {teams.map((team, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "10px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{team.data.teamName}</strong> - 팀장:{" "}
                      {team.data.captain.name} - 포지션:{" "}
                      {team.data.requiredPositions.length}개 - 포인트:{" "}
                      {team.hook.points}
                    </div>
                    <button
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleRemoveTeam(index)}
                    >
                      제거
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            경매 시작
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

          <AuctionLayout
            teams={teams.map((team) => ({
              teamName: team.data.teamName,
              requiredPositions: team.data.requiredPositions,
              captain: team.data.captain,
              initialPoints: team.data.initialPoints,
              players: team.hook.players,
              points: team.hook.points,
              playerCount: team.hook.playerCount,
              addPlayer: team.hook.addPlayer,
              removePlayer: team.hook.removePlayer,
            }))}
            onRemoveTeam={handleRemoveTeam}
          />
        </div>
      )}
    </div>
  );
}
