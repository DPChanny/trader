import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/section.module.css";

const sectionVariants = cva(styles.section, {
  variants: {
    variantType: {
      primary: styles["section--primary"],
      secondary: styles["section--secondary"],
      tertiary: styles["section--tertiary"],
      invisible: styles["section--invisible"],
    },
    variantLayout: {
      column: styles["section--column"],
      row: styles["section--row"],
      grid: styles["section--grid"],
    },
  },
  defaultVariants: {
    variantType: "primary",
    variantLayout: "column",
  },
});

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: any;
  variantType?: "primary" | "secondary" | "tertiary" | "invisible";
  variantLayout?: "column" | "row" | "grid";
  className?: string;
}

export function Section({
  children,
  variantType = "primary",
  variantLayout = "column",
  className,
}: SectionProps) {
  return (
    <div
      className={cn(sectionVariants({ variantType, variantLayout }), className)}
    >
      {children}
    </div>
  );
}
