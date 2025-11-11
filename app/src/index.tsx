import { render } from "preact";
import { useState } from "preact/hooks";
import { QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "@/pages/home/homePage";
import { PresetPage } from "@/pages/preset/presetPage";
import { UserPage } from "@/pages/user/userPage";
import { Header } from "@/components/header";
import { queryClient } from "@/lib/queryClient.ts";
import "@/styles/global.css";
import "@/styles/app.css";

type PageView = "home" | "user" | "preset";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("home");

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
  };

  if (currentPage === "home") {
    return <HomePage onNavigate={handleNavigate} />;
  }

  if (currentPage === "user") {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <UserPage />
      </div>
    );
  }

  if (currentPage === "preset") {
    return (
      <div className="app-container">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <PresetPage />
      </div>
    );
  }

  return null;
}

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!
);
