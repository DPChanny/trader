import { cva } from "class-variance-authority";
import styles from "@/styles/components/header.module.css";

type PageView = "home" | "user" | "preset" | "auction";

const navItemVariants = cva(styles.navItem, {
  variants: {
    variantActive: {
      true: styles["navItem--active"],
      false: "",
    },
  },
  defaultVariants: {
    variantActive: false,
  },
});

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
    <header className={styles.header}>
      <div className={styles.header__content}>
        <div className={styles.header__logo} onClick={() => onNavigate("home")}>
          <span className={styles.header__icon}>🎮</span>
          <span className={styles.header__text}>Trader</span>
        </div>

        {showNav && (
          <nav className={styles.header__nav}>
            <button
              className={navItemVariants({
                variantActive: currentPage === "home",
              })}
              onClick={() => onNavigate("home")}
            >
              홈
            </button>
            <button
              className={navItemVariants({
                variantActive: currentPage === "user",
              })}
              onClick={() => onNavigate("user")}
            >
              유저 관리
            </button>
            <button
              className={navItemVariants({
                variantActive: currentPage === "preset",
              })}
              onClick={() => onNavigate("preset")}
            >
              프리셋 관리
            </button>
            <button
              className={navItemVariants({
                variantActive: currentPage === "auction",
              })}
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
