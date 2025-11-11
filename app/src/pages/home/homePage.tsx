import { useState, useEffect } from "preact/hooks";
import styles from "@/styles/pages/home/homePage.module.css";
import { isAuthenticated, removeAuthToken, refreshAuthToken } from "@/lib/auth";
import { useAdminLogin } from "@/hooks/useAdminApi";
import { Error } from "@/components/error";
import { SecondaryButton, PrimaryButton } from "@/components/button";
import { Label } from "@/components/label";
import { Input } from "@/components/input";

interface HomeProps {
  onNavigate: (page: "preset" | "user") => void;
}

export function HomePage({ onNavigate }: HomeProps) {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [loginError, setLoginError] = useState<string | null>(null);
  const loginMutation = useAdminLogin();

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
    setLoginError(null);
    try {
      await loginMutation.mutateAsync(password);
      setIsLoggedIn(true);
      setPassword("");
    } catch (err) {
      const error = err as Error;
      setLoginError(error.message || "로그인 실패");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
  };

  return (
    <div class={styles.homeContainer}>
      <h1 class={styles.homeTitle}>창식이 롤 내전</h1>

      {!isLoggedIn && (
        <div class={styles.loginBox}>
          <h2 class={styles.loginTitle}>관리자 로그인</h2>
          <form onSubmit={handleLogin} class={styles.loginForm}>
            {loginError && <Error message={loginError} />}
            <div>
              <Label>비밀번호</Label>
              <Input
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="관리자 비밀번호"
                disabled={loginMutation.isPending}
                autoFocus
              />
            </div>
            <PrimaryButton
              type="submit"
              disabled={loginMutation.isPending || !password}
            >
              {loginMutation.isPending ? "로그인 중" : "로그인"}
            </PrimaryButton>
          </form>
        </div>
      )}

      {isLoggedIn && (
        <>
          <div class={styles.logoutContainer}>
            <SecondaryButton onClick={handleLogout}>로그아웃</SecondaryButton>
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
