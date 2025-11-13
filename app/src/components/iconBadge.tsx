import { cn } from "@/lib/utils";
import styles from "@/styles/components/badge.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const iconBadgeVariants = cva(styles.badge, {
  variants: {
    color: {
      blue: styles["badge--blue"],
      red: styles["badge--red"],
      gold: styles["badge--gold"],
      green: styles["badge--green"],
      gray: styles["badge--gray"],
    },
    size: {
      sm: styles["badge--sm"],
      md: styles["badge--md"],
      lg: styles["badge--lg"],
    },
    variant: {
      solid: "",
      outline: styles["badge--outline"],
    },
  },
  defaultVariants: {
    color: "blue",
    size: "md",
    variant: "solid",
  },
});

export type IconBadgeProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  variantColor?: VariantProps<typeof iconBadgeVariants>["color"];
  variantSize?: VariantProps<typeof iconBadgeVariants>["size"];
  variantVariant?: VariantProps<typeof iconBadgeVariants>["variant"];
};

export function IconBadge({
  src,
  alt,
  className,
  variantColor,
  variantSize,
  variantVariant,
}: IconBadgeProps) {
  const baseClass = iconBadgeVariants({
    color: variantColor,
    size: variantSize,
    variant: variantVariant,
  });

  return (
    <span className={cn(baseClass, className)}>
      {src ? (
        <img
          src={src}
          alt={alt || "icon"}
          style={{
            width: "80%",
            height: "80%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : null}
    </span>
  );
}
