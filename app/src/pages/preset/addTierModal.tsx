import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import modalStyles from "@/styles/components/modal.module.css";

interface AddTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  tierName: string;
  onNameChange: (value: string) => void;
  isPending?: boolean;
  error?: Error | null;
}

export function AddTierModal({
  isOpen,
  onClose,
  onSubmit,
  tierName,
  onNameChange,
  isPending = false,
  error,
}: AddTierModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="티어 추가">
      <form onSubmit={onSubmit}>
        {error && <Error>티어 추가에 실패했습니다.</Error>}
        <div>
          <Label>티어 이름</Label>
          <Input type="text" value={tierName} onChange={onNameChange} />
        </div>
        <div className={modalStyles.buttonRow}>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !tierName.trim()}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
