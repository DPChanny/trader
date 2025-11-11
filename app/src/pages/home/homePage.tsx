import styles from "@/styles/pages/home/homePage.module.css";

interface HomeProps {
  onNavigate: (page: "preset" | "user") => void;
}

export function HomePage({ onNavigate }: HomeProps) {
  return (
    <div class={styles.homeContainer}>
      <h1 class={styles.homeTitle}>창식이 롤 내전</h1>
      <div class={styles.homeButtons}>
        <button
          class={`${styles.homeBtn} ${styles.homeBtnUser}`}
          onClick={() => onNavigate("user")}
        >
          <div class={styles.btnIcon}>👤</div>
          <div class={styles.btnText}>유저 관리</div>
          <div class={styles.btnDescription}>유저 추가, 수정, 삭제</div>
        </button>
        <button
          class={`${styles.homeBtn} ${styles.homeBtnPreset}`}
          onClick={() => onNavigate("preset")}
        >
          <div class={styles.btnIcon}>⚙️</div>
          <div class={styles.btnText}>프리셋 관리</div>
          <div class={styles.btnDescription}>프리셋 추가, 수정, 삭제</div>
        </button>
      </div>
    </div>
  );
}
