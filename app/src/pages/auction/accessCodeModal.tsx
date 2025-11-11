import { useState } from "preact/hooks";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";

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
      <div className="flex flex-col gap-4">
        <p className="text-white/80">팀장 액세스 코드를 입력해주세요</p>

        <div>
          <Input
            type="text"
            value={accessCode}
            onChange={setAccessCode}
            placeholder="액세스 코드 입력"
            autoFocus
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!accessCode.trim()}>
            참가
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
