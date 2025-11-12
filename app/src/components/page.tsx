import type { JSX } from "preact";
import styles from "@/styles/components/page.module.css";

interface PageLayoutProps {
  children: JSX.Element | JSX.Element[] | null | undefined;
  className?: string;
}

interface PageContainerProps {
  children: JSX.Element | JSX.Element[] | null | undefined;
  className?: string;
}

/**
 * PageLayout
 *
 * Role: 페이지 전체 레이아웃의 최상위 컨테이너
 * - 100vw x 100vh 뷰포트를 차지하는 전체 화면 래퍼
 * - Header와 PageContainer를 수직으로 배치
 * - 페이지의 전체 배경과 overflow 관리
 *
 * Usage:
 * - 모든 페이지의 최상위 컴포넌트
 * - Header + PageContainer의 부모 컨테이너
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={`${styles.pageLayout} ${className || ""}`}>{children}</div>
  );
}

/**
 * PageContainer
 *
 * Role: 페이지 내부의 메인 컨텐츠 컨테이너
 * - PageLayout 내부에서 사용되는 flex 컨테이너
 * - 좌우로 섹션을 배치하기 위한 수평 레이아웃 제공
 * - 리스트와 그리드 영역을 분할하는 역할
 *
 * Usage:
 * - PresetPage: presetListContainer (left) + Section (right)
 * - UserPage: listContainer (left) + Section (right)
 * - AuctionPage: 전체 레이아웃 래퍼
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={`${styles.pageContainer} ${className || ""}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  children?: JSX.Element | JSX.Element[] | null;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <>
      <div className={`${styles.pageHeader} ${className || ""}`}>
        <h2 className={styles.pageTitle}>{title}</h2>
        {children && <div className={styles.pageActions}>{children}</div>}
      </div>
    </>
  );
}
