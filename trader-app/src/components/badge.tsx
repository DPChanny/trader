import "@/styles/components/badge.css";

interface BadgeProps {
  children: string;
  color?: "blue" | "red" | "gold";
}

export function Badge({ children, color = "blue" }: BadgeProps) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}
