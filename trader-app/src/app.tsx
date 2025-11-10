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

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
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
  if (currentPage === "preset") {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <PresetPage onNavigateToAuction={() => handleNavigate("auction")} />
      </div>
    );
  }

  // Auction page
  if (currentPage === "auction") {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <AuctionPage />
      </div>
    );
  }

  return null;
}
