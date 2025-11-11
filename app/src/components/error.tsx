import styles from "@/styles/components/error.module.css";

interface ErrorProps {
  message?: string;
  children?: any;
}

export function Error({ message, children }: ErrorProps) {
  return (
    <div className={styles.error}>
      {children || message || "오류가 발생했습니다."}
    </div>
  );
}
