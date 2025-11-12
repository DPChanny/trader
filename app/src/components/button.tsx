import type { JSX } from "preact";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/button.module.css";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(styles.button, {
  variants: {
    intent: {
      primary: styles["button--primary"],
      secondary: styles["button--secondary"],
      destructive: styles["button--destructive"],
    },
    tone: {
      solid: "",
      outline: styles["button--outline"],
    },
    size: {
      sm: styles["button--sm"],
      md: styles["button--md"],
      lg: styles["button--lg"],
    },
    isIcon: {
      true: styles["button--icon"],
      false: "",
    },
  },
  defaultVariants: {
    intent: "primary",
    tone: "solid",
    size: "md",
    isIcon: false,
  },
});

export type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  children?: JSX.Element | string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variantIntent?: VariantProps<typeof buttonVariants>["intent"];
  variantTone?: VariantProps<typeof buttonVariants>["tone"];
  variantSize?: VariantProps<typeof buttonVariants>["size"];
  variantIsIcon?: VariantProps<typeof buttonVariants>["isIcon"];
};

export function Button({
  className,
  variantIntent,
  variantTone,
  variantSize,
  variantIsIcon,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClass = buttonVariants({
    intent: variantIntent,
    tone: variantTone,
    size: variantSize,
    isIcon: variantIsIcon,
  });

  return <button type={type} className={cn(baseClass, className)} {...props} />;
}

export function PrimaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, "variantIntent">) {
  return <Button variantIntent="destructive" {...props} />;
}

export function EditButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="primary"
      title="수정"
      {...props}
    >
      ✎
    </Button>
  );
}

export function DeleteButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="destructive"
      title="삭제"
      {...props}
    >
      🗑
    </Button>
  );
}

export function CloseButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="destructive"
      title="닫기"
      {...props}
    >
      ✕
    </Button>
  );
}

export function SaveButton(
  props: Omit<ButtonProps, "children" | "variantIsIcon">
) {
  return (
    <Button
      variantIsIcon={true}
      variantIntent="primary"
      title="저장"
      {...props}
    >
      ✓
    </Button>
  );
}
