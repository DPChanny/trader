import { useState, useEffect } from "preact/hooks";
import { Modal, ModalForm, ModalFooter } from "@/components/modal";
import { LabelInput } from "@/components/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

interface EditPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, iconUrl: string) => void;
  positionId: number | null;
  name: string;
  iconUrl: string;
  isPending?: boolean;
  error?: any;
}

export function EditPositionModal({
  isOpen,
  onClose,
  onSubmit,
  name: propName,
  iconUrl: propIconUrl,
  isPending = false,
  error,
}: EditPositionModalProps) {
  const [name, setName] = useState(propName);
  const [iconUrl, setIconUrl] = useState(propIconUrl);

  // Sync local state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setName(propName);
      setIconUrl(propIconUrl);
    }
  }, [isOpen, propName, propIconUrl]);

  const handleClose = () => {
    // Reset state when closing
    setName(propName);
    setIconUrl(propIconUrl);
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), iconUrl.trim());
  };

  const hasChanges = name !== propName || iconUrl !== propIconUrl;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="포지션 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error && <Error>포지션 수정에 실패했습니다.</Error>}
        <LabelInput
          label="포지션 이름"
          value={name}
          onChange={(value) => setName(value)}
          placeholder="예: TOP, JUG, MID, SUP, BOT"
          autoFocus
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
          value={iconUrl}
          onChange={(value) => setIconUrl(value)}
          placeholder="https://example.com/icon.png"
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !hasChanges || !name.trim()}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
