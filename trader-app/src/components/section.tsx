import "@/styles/components/section.css";

interface SectionProps {
  children: any;
  variant?: "primary" | "secondary";
  className?: string;
}

export function Section({
  children,
  variant = "primary",
  className = "",
}: SectionProps) {
  return (
    <div className={`section section-${variant} ${className}`}>{children}</div>
  );
}
