import "./homePage.css";

interface HomeProps {
  onNavigate: (page: "auction" | "preset" | "user") => void;
}

export function HomePage({ onNavigate }: HomeProps) {
  return (
    <div class="home-container">
      <h1 class="home-title">창식이 롤 내전</h1>
      <div class="home-buttons">
        <button
          class="home-btn home-btn-user"
          onClick={() => onNavigate("user")}
        >
          <div class="btn-icon">👤</div>
          <div class="btn-text">유저 관리</div>
          <div class="btn-description">유저 추가, 수정, 삭제</div>
        </button>
        <button
          class="home-btn home-btn-preset"
          onClick={() => onNavigate("preset")}
        >
          <div class="btn-icon">⚙️</div>
          <div class="btn-text">프리셋 관리</div>
          <div class="btn-description">프리셋 추가, 수정, 삭제</div>
        </button>
      </div>
    </div>
  );
}
