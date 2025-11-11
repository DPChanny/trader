import styles from "@/styles/components/loading.module.css";

interface LoadingProps {
  message?: string;
  children?: any;
}

export function Loading({ message, children }: LoadingProps) {
  return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner}></div>
      <div className={styles.loading__text}>
        {children || message || "로딩중..."}
      </div>
    </div>
  );
}
