import "./bar.css";

interface BarProps {
  variant?: "blue" | "purple" | "red" | "green";
}

export function Bar({ variant = "blue" }: BarProps) {
  return <div className={`bar bar-${variant}`}></div>;
}
