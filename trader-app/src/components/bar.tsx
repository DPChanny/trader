import { cn } from "@/lib/utils";
import styles from "@/styles/components/bar.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const barVariants = cva(styles.bar, {
  variants: {
    variant: {
      blue: styles["bar--blue"],
      purple: styles["bar--purple"],
      red: styles["bar--red"],
      green: styles["bar--green"],
    },
  },
  defaultVariants: {
    variant: "blue",
  },
});

export type BarProps = {
  className?: string;
  variantVariant?: VariantProps<typeof barVariants>["variant"];
};

export function Bar({ className, variantVariant }: BarProps) {
  const baseClass = barVariants({
    variant: variantVariant,
  });

  return <div className={cn(baseClass, className)} />;
}
