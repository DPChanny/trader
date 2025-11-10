import { cn } from "@/lib/utils";
import styles from "@/styles/components/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const barVariants = cva(styles.bar, {
  variants: {
    color: {
      blue: styles["bar--blue"],
      purple: styles["bar--purple"],
      red: styles["bar--red"],
      green: styles["bar--green"],
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export type BarProps = {
  className?: string;
  variantColor?: VariantProps<typeof barVariants>["color"];
};

export function Bar({ className, variantColor: variantVariant }: BarProps) {
  const baseClass = barVariants({
    color: variantVariant,
  });

  return <div className={cn(baseClass, className)} />;
}
