import { Modal } from "./modal";
import { PrimaryButton, SecondaryButton } from "./button";
import styles from "@/styles/components/confirmModal.module.css";

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
      <div className={styles.confirm__actions}>
        <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
        <PrimaryButton onClick={handleConfirm} disabled={isPending}>
          {confirmText}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
