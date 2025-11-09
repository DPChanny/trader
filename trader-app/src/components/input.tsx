import "./input.css";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: "text" | "number" | "email" | "password";
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
  className = "",
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={`input ${className}`}
    />
  );
}
