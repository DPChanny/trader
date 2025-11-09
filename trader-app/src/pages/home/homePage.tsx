import "./homePage.css";

interface HomeProps {
  onNavigate: (page: "auction" | "preset" | "user") => void;
}

export function HomePage({ onNavigate }: HomeProps) {
  return (
    <div class="home-container">
      <h1 class="home-title">플레이어 경매 시스템</h1>
      <div class="home-buttons">
        <button
          class="home-btn home-btn-user"
          onClick={() => onNavigate("user")}
        >
          <div class="btn-icon">👤</div>
          <div class="btn-text">사용자 관리</div>
          <div class="btn-description">사용자 추가, 수정, 삭제</div>
        </button>
        <button
          class="home-btn home-btn-preset"
          onClick={() => onNavigate("preset")}
        >
          <div class="btn-icon">⚙️</div>
          <div class="btn-text">경매 설정</div>
          <div class="btn-description">팀장 선택 및 경매 준비</div>
        </button>
      </div>
    </div>
  );
}
