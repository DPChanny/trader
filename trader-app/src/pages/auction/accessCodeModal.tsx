import { useState } from "preact/hooks";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import "./accessCodeModal.css";

interface AccessCodeModal {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accessCode: string) => void;
  sessionId: string;
}

export function AccessCodeModal({
  isOpen,
  onClose,
  onSubmit,
}: AccessCodeModal) {
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = () => {
    if (accessCode.trim()) {
      onSubmit(accessCode);
      setAccessCode("");
      onClose();
    }
  };

  const handleClose = () => {
    setAccessCode("");
    onClose();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="팀장으로 참가">
      <div className="leader-access-modal">
        <p className="modal-description">팀장 액세스 코드를 입력해주세요</p>

        <div className="access-code-input">
          <Input
            type="text"
            value={accessCode}
            onChange={setAccessCode}
            placeholder="액세스 코드 입력"
            autoFocus
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="modal-actions">
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!accessCode.trim()}>
            참가
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
