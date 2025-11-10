import { cn } from "@/lib/utils";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(styles.badge, {
  variants: {
    color: {
      blue: styles["badge--blue"],
      red: styles["badge--red"],
      gold: styles["badge--gold"],
      green: styles["badge--green"],
      gray: styles["badge--gray"],
    },
    variant: {
      solid: "",
      outline: styles["badge--outline"],
    },
    size: {
      sm: styles["badge--sm"],
      md: styles["badge--md"],
      lg: styles["badge--lg"],
    },
  },
  defaultVariants: {
    color: "blue",
    variant: "solid",
    size: "md",
  },
});

export type BadgeProps = {
  children: string;
  className?: string;
  variantColor?: VariantProps<typeof badgeVariants>["color"];
  variantVariant?: VariantProps<typeof badgeVariants>["variant"];
  variantSize?: VariantProps<typeof badgeVariants>["size"];
};

export function Badge({
  children,
  className,
  variantColor,
  variantVariant,
  variantSize,
}: BadgeProps) {
  const baseClass = badgeVariants({
    color: variantColor,
    variant: variantVariant,
    size: variantSize,
  });

  return <span className={cn(baseClass, className)}>{children}</span>;
}
