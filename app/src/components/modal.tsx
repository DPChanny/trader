import { createPortal } from "preact/compat";
import { cn } from "@/lib/utils";
import { Bar } from "@/components/bar";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import styles from "@/styles/components/modal.module.css";
import type { JSX } from "preact";

/* ==========================================
   Modal Base Component
   ========================================== */

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className={cn(styles.modal, className)}>
      <div className={styles.modal__overlay} onClick={onClose}>
        <div
          className={styles.modal__content}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modal__header}>
            <h3 className={styles.modal__title}>{title}</h3>
          </div>
          <Bar
            variantColor="blue"
            variantThickness="thin"
            className={styles.divider}
          />
          <div className={styles.modal__body}>{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ==========================================
   Modal Form Component
   ========================================== */

interface ModalFormProps {
  onSubmit: (e: Event) => void;
  children: JSX.Element | JSX.Element[] | (JSX.Element | null | undefined)[];
  className?: string;
}

export function ModalForm({ onSubmit, children, className }: ModalFormProps) {
  return (
    <form onSubmit={onSubmit} className={className || styles.form}>
      {children}
    </form>
  );
}

/* ==========================================
   Modal Row Component
   ========================================== */

interface ModalRowProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalRow({ children, className }: ModalRowProps) {
  return <div className={className || styles.row}>{children}</div>;
}

/* ==========================================
   Modal Footer Component
   ========================================== */

interface ModalFooterProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={className || styles.modalFooter}>{children}</div>;
}

/* ==========================================
   Confirm Modal Component
   ========================================== */

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isPending = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.confirm__message}>{message}</div>
      <ModalFooter>
        <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
        <PrimaryButton onClick={handleConfirm} disabled={isPending}>
          {confirmText}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
