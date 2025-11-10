import "@/styles/components/loading.css";

interface LoadingProps {
  message?: string;
  children?: any;
}

export function Loading({ message, children }: LoadingProps) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">{children || message || "로딩중..."}</div>
    </div>
  );
}
