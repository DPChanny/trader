import { Modal } from "../../components/modal";
import { Input } from "../../components/input";
import { PrimaryButton, SecondaryButton } from "../../components/button";
import { Label } from "../../components/label";

interface CreateTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  tierName: string;
  onNameChange: (value: string) => void;
}

export function CreateTierModal({
  isOpen,
  onClose,
  onSubmit,
  tierName,
  onNameChange,
}: CreateTierModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="티어 추가">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <Label>티어 이름</Label>
          <Input type="text" value={tierName} onChange={onNameChange} />
        </div>
        <div className="modal-actions">
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={!tierName.trim()}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
