import "./index.css";

interface IndexProps {
  onNavigate: (page: "auction" | "preset" | "user") => void;
}

export function IndexPage({ onNavigate }: IndexProps) {
  return (
    <div class="index-container">
      <h1 class="index-title">플레이어 경매 시스템</h1>
      <div class="index-buttons">
        <button
          class="index-btn index-btn-user"
          onClick={() => onNavigate("user")}
        >
          <div class="btn-icon">👤</div>
          <div class="btn-text">사용자 관리</div>
          <div class="btn-description">사용자 추가, 수정, 삭제</div>
        </button>
        <button
          class="index-btn index-btn-preset"
          onClick={() => onNavigate("preset")}
        >
          <div class="btn-icon">⚙️</div>
          <div class="btn-text">경매 설정</div>
          <div class="btn-description">팀장 선택 및 경매 준비</div>
        </button>
        <button
          class="index-btn index-btn-auction"
          onClick={() => onNavigate("auction")}
        >
          <div class="btn-icon">🎯</div>
          <div class="btn-text">경매 진행</div>
          <div class="btn-description">실시간 경매 시작</div>
        </button>
      </div>
    </div>
  );
}
