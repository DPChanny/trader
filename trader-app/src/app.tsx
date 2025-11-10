import { useState } from "preact/hooks";
import "./app.css";
import { HomePage } from "./pages/home/homePage";
import { PresetPage } from "./pages/preset/presetPage";
import { AuctionPage } from "./pages/auction/auctionPage";
import { UserPage } from "./pages/user/userPage";
import { Header } from "./components/header";

type PageView = "home" | "user" | "preset" | "auction";

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("home");
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);

  const handleNavigate = (page: PageView) => {
    if (page === "auction" && !isAuctionStarted) {
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
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <UserPage />
      </div>
    );
  }

  // Preset page
  if (currentPage === "preset" && !isAuctionStarted) {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <PresetPage onStartAuction={handleStartAuction} />
      </div>
    );
  }

  // Auction page
  if (currentPage === "auction" || isAuctionStarted) {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <AuctionPage teams={[]} />
      </div>
    );
  }

  return null;
}
