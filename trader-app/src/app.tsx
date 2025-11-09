import { useState } from "preact/hooks";
import "./app.css";
import { HomePage } from "./pages/home/homePage";
import { PresetPage } from "./pages/preset/presetPage";
import { AuctionPage } from "./pages/auction/auctionPage";
import { UserPage } from "./pages/user/userPage";
import { PrimaryButton } from "./components/button";

type PageView = "home" | "user" | "preset" | "auction";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("home");
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);

  const handleNavigate = (page: PageView) => {
    if (page === "auction") {
      return;
    }
    setCurrentPage(page);
  };

  const handleStartAuction = () => {
    setIsAuctionStarted(true);
    setCurrentPage("auction");
  };

  // Index page
  if (currentPage === "home") {
    return <HomePage onNavigate={handleNavigate} />;
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
        <div className="page-header">
          <PrimaryButton onClick={() => setCurrentPage("home")}>
            ← 홈으로
          </PrimaryButton>
          <h1>사용자 관리</h1>
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
        <div className="page-header">
          <PrimaryButton onClick={() => setCurrentPage("home")}>
            ← 홈으로
          </PrimaryButton>
          <h1>경매 설정</h1>
        </div>
        <div
          style={{
            padding: "0 20px 20px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <PresetPage onStartAuction={handleStartAuction} />
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
        <div className="page-header">
          <PrimaryButton onClick={() => setCurrentPage("home")}>
            ← 홈으로
          </PrimaryButton>
          <h1>경매 진행</h1>
        </div>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <AuctionPage teams={[]} />
        </div>
      </div>
    );
  }

  return null;
}
