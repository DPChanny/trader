import { useState } from "preact/hooks";
import "./app.css";
import { IndexPage } from "./pages/index";
import { PresetPage } from "./pages/preset/presetPage";
import { AuctionPage } from "./pages/auction/auctionPage";
import { UserPage } from "./pages/user/userPage";

type PageView = "index" | "user" | "preset" | "auction";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("index");
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);

  const handleResetAuction = () => {
    setIsAuctionStarted(false);
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
            <PresetPage />
          </div>
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

          <AuctionPage teams={[]} />
        </div>
      </div>
    );
  }

  return null;
}
