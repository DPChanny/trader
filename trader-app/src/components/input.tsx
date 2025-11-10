import { cn } from "@/lib/utils";
import styles from "@/styles/components/input.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(styles.input, {
  variants: {
    intent: {
      default: styles["input--default"],
      error: styles["input--error"],
    },
    tone: {
      solid: styles["input--solid"],
      outline: styles["input--outline"],
      ghost: styles["input--ghost"],
    },
    size: {
      sm: styles["input--sm"],
      md: styles["input--md"],
      lg: styles["input--lg"],
    },
  },
  defaultVariants: {
    intent: "default",
    tone: "solid",
    size: "md",
  },
});

export type InputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: "text" | "number" | "email" | "password";
  className?: string;
  variantIntent?: VariantProps<typeof inputVariants>["intent"];
  variantTone?: VariantProps<typeof inputVariants>["tone"];
  variantSize?: VariantProps<typeof inputVariants>["size"];
};

export function Input({
  value,
  onChange,
  onKeyPress,
  placeholder,
  autoFocus,
  disabled,
  type = "text",
  className,
  variantIntent,
  variantTone,
  variantSize,
}: InputProps) {
  const baseClass = inputVariants({
    intent: variantIntent,
    tone: variantTone,
    size: variantSize,
  });

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={cn(baseClass, className)}
    />
  );
}
