import { createPortal } from "preact/compat";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/modal.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact";

const modalVariants = cva(styles.modal, {
  variants: {
    size: {
      sm: styles["modal--sm"],
      md: styles["modal--md"],
      lg: styles["modal--lg"],
      full: styles["modal--full"],
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
  variantSize?: VariantProps<typeof modalVariants>["size"];
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  variantSize,
}: ModalProps) {
  if (!isOpen) return null;

  const baseClass = modalVariants({
    size: variantSize,
  });

  const modalContent = (
    <div className={cn(baseClass, className)}>
      <div className={styles.modal__overlay} onClick={onClose}>
        <div
          className={styles.modal__content}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modal__header}>
            <h3 className={styles.modal__title}>{title}</h3>
          </div>
          <div className={styles.modal__body}>{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
