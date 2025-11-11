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
    thickness: {
      thin: styles["bar--thin"],
      medium: styles["bar--medium"],
      thick: styles["bar--thick"],
    },
  },
  defaultVariants: {
    color: "blue",
    thickness: "thin",
  },
});

export type BarProps = {
  className?: string;
  variantColor?: VariantProps<typeof barVariants>["color"];
  variantThickness?: VariantProps<typeof barVariants>["thickness"];
};

export function Bar({ className, variantColor, variantThickness }: BarProps) {
  const baseClass = barVariants({
    color: variantColor,
    thickness: variantThickness,
  });

  return <div className={cn(baseClass, className)} />;
}
