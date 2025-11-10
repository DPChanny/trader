import "@/styles/components/header.css";

type PageView = "home" | "user" | "preset" | "auction";

interface HeaderProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  showNav?: boolean;
}

export function Header({
  currentPage,
  onNavigate,
  showNav = true,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-logo" onClick={() => onNavigate("home")}>
          <span className="logo-icon">🎮</span>
          <span className="logo-text">Trader</span>
        </div>

        {showNav && (
          <nav className="header-nav">
            <button
              className={`nav-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => onNavigate("home")}
            >
              홈
            </button>
            <button
              className={`nav-item ${currentPage === "user" ? "active" : ""}`}
              onClick={() => onNavigate("user")}
            >
              유저 관리
            </button>
            <button
              className={`nav-item ${currentPage === "preset" ? "active" : ""}`}
              onClick={() => onNavigate("preset")}
            >
              프리셋 관리
            </button>
            <button
              className={`nav-item ${
                currentPage === "auction" ? "active" : ""
              }`}
              onClick={() => onNavigate("auction")}
            >
              경매
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
