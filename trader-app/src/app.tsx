import { useState } from "preact/hooks";
import "./app.css";
import type { User, Team } from "./types";
import { IndexPage } from "./pages/index";
import { Preset } from "./pages/preset/preset";
import { Auction } from "./pages/auction/auction";
import { UserPage } from "./pages/user/user";

const AVAILABLE_USERS: User[] = [
  {
    user_id: 1,
    nickname: "손흥민",
    riot_nickname: "Sonny7",
    position: "TOP",
    tier: "S",
  },
  {
    user_id: 2,
    nickname: "이강인",
    riot_nickname: "KangIn19",
    position: "MID",
    tier: "A",
  },
  {
    user_id: 3,
    nickname: "김민재",
    riot_nickname: "Monster",
    position: "SUP",
    tier: "A",
  },
  {
    user_id: 4,
    nickname: "황희찬",
    riot_nickname: "Wolverine",
    position: "JUG",
    tier: "B",
  },
  {
    user_id: 5,
    nickname: "조현우",
    riot_nickname: "Keeper",
    position: "BOT",
    tier: "S",
  },
  {
    user_id: 6,
    nickname: "황인범",
    riot_nickname: "InBeom",
    position: "MID",
    tier: "B",
  },
];

const FIXED_POSITIONS = ["TOP", "JUG", "MID", "SUP", "BOT"];

type PageView = "index" | "user" | "preset" | "auction";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("index");
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  // Preset 설정 상태
  const [selectedCaptains, setSelectedCaptains] = useState<User[]>([]);
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
        teamName: `${captain.nickname} 팀`,
        captain: captain,
        requiredPositions: FIXED_POSITIONS,
        initialPoints: initialPoints,
        players: emptyPlayers,
        points: initialPoints,
      };
    });

    setTeams(newTeams);
    setIsAuctionStarted(true);
    setCurrentPage("auction");
  };

  const handleResetAuction = () => {
    setIsAuctionStarted(false);
    setTeams([]);
    setCurrentPage("index");
  };

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
  };

  // Index page
  if (currentPage === "index") {
    return <IndexPage onNavigate={handleNavigate} />;
  }

  // User management page
  if (currentPage === "user") {
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
        <div style={{ padding: "20px", background: "#f5f5f5" }}>
          <h1>플레이어 경매 시스템</h1>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px",
            }}
            onClick={() => setCurrentPage("index")}
          >
            ← 홈으로
          </button>
        </div>
        <UserPage />
      </div>
    );
  }

  // Preset page
  if (currentPage === "preset" && !isAuctionStarted) {
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
        <div
          style={{
            padding: "0 20px 20px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
            onClick={() => setCurrentPage("index")}
          >
            ← 홈으로
          </button>

          <div style={{ marginBottom: "20px" }}>
            <Preset
              availableUsers={AVAILABLE_USERS}
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
      </div>
    );
  }

  // Auction page
  if (currentPage === "auction" || isAuctionStarted) {
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

          <Auction teams={teams} />
        </div>
      </div>
    );
  }

  return null;
}
