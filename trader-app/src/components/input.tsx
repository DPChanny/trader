import "@/styles/components/input.css";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: "text" | "number" | "email" | "password";
  size?: "default" | "small";
  className?: string;
}

export function Input({
  value,
  onChange,
  onKeyPress,
  placeholder,
  autoFocus,
  disabled,
  type = "text",
  size = "default",
  className = "",
}: InputProps) {
  const sizeClass = size === "small" ? "input-small" : "";

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={`input ${sizeClass} ${className}`}
    />
  );
}
