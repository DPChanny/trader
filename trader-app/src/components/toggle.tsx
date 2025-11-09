import "./toggle.css";

interface ToggleProps {
  children?: string;
  active: boolean;
  color?: "blue" | "red" | "gold";
  onClick: () => void;
}

export function Toggle({
  children,
  active,
  color = "blue",
  onClick,
}: ToggleProps) {
  return (
    <button
      className={`toggle toggle-${color} ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
