import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/section.module.css";

const sectionVariants = cva(styles.section, {
  variants: {
    variantType: {
      primary: styles["section--primary"],
      secondary: styles["section--secondary"],
      invisible: styles["section--invisible"],
    },
    variantGrid: {
      true: styles["section--grid"],
      false: "",
    },
  },
  defaultVariants: {
    variantType: "primary",
    variantGrid: false,
  },
});

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: any;
  variant?: "primary" | "secondary" | "invisible";
  isGrid?: boolean;
  className?: string;
}

export function Section({
  children,
  variant = "primary",
  isGrid = false,
  className,
}: SectionProps) {
  return (
    <div
      className={cn(
        sectionVariants({ variantType: variant, variantGrid: isGrid }),
        className
      )}
    >
      {children}
    </div>
  );
}
