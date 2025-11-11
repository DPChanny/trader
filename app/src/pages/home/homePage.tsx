import { useState, useEffect } from "preact/hooks";
import styles from "@/styles/pages/home/homePage.module.css";
import { isAuthenticated, removeAuthToken, refreshAuthToken } from "@/lib/auth";
import { useAdminLogin, useTokenRefresh } from "@/hooks/useAdminApi";

interface HomeProps {
  onNavigate: (page: "preset" | "user") => void;
}

export function HomePage({ onNavigate }: HomeProps) {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const loginMutation = useAdminLogin();
  const refreshMutation = useTokenRefresh();

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());

    // Set up periodic token refresh check (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      if (isAuthenticated()) {
        try {
          await refreshAuthToken();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(password);
      setIsLoggedIn(true);
      setPassword("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "로그인 실패");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
  };

  const handleRefreshToken = async () => {
    try {
      await refreshMutation.mutateAsync();
      alert("토큰이 갱신되었습니다");
    } catch (error) {
      alert(error instanceof Error ? error.message : "토큰 갱신 실패");
    }
  };

  return (
    <div class={styles.homeContainer}>
      <h1 class={styles.homeTitle}>창식이 롤 내전</h1>

      {!isLoggedIn ? (
        <div class={styles.loginBox}>
          <h2 class={styles.loginTitle}>관리자 로그인</h2>
          <form onSubmit={handleLogin} class={styles.loginForm}>
            <input
              type="password"
              placeholder="관리자 비밀번호"
              class={styles.loginInput}
              value={password}
              onInput={(e) => setPassword(e.currentTarget.value)}
              disabled={loginMutation.isPending}
            />
            <button
              type="submit"
              class={styles.loginBtn}
              disabled={loginMutation.isPending || !password}
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div class={styles.logoutContainer}>
            <button
              class={styles.refreshBtn}
              onClick={handleRefreshToken}
              disabled={refreshMutation.isPending}
              title="토큰 갱신"
            >
              🔄
            </button>
            <button class={styles.logoutBtn} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
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
        </>
      )}
    </div>
  );
}
