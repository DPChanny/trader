import { Modal } from "./modal";
import { PrimaryButton, SecondaryButton } from "./button";
import "@/styles/components/confirmModal.css";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-message">{message}</div>
      <div className="modal-actions">
        <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
        <PrimaryButton onClick={handleConfirm}>{confirmText}</PrimaryButton>
      </div>
    </Modal>
  );
}
