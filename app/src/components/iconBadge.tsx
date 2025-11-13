import {cn} from "@/lib/utils";
import styles from "@/styles/components/badge.module.css";
import {cva, type VariantProps} from "class-variance-authority";

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
        // 이미지가 배지 영역을 가득 채우도록 스타일 적용
        <img
          src={src}
          alt={alt || "icon"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
            display: "block",
          }}
        />
      ) : null}
    </span>
  );
}

