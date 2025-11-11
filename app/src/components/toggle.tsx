import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/toggle.module.css";

const toggleVariants = cva(styles.toggle, {
  variants: {
    variantColor: {
      blue: styles["toggle--blue"],
      red: styles["toggle--red"],
      gold: styles["toggle--gold"],
    },
    variantActive: {
      true: styles["toggle--active"],
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantActive: false,
  },
});

interface ToggleProps extends VariantProps<typeof toggleVariants> {
  children?: string;
  active: boolean;
  color?: "blue" | "red" | "gold";
  onClick: () => void;
  className?: string;
}

export function Toggle({
  children,
  active,
  color = "blue",
  onClick,
  className,
}: ToggleProps) {
  return (
    <button
      className={cn(
        toggleVariants({ variantColor: color, variantActive: active }),
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
