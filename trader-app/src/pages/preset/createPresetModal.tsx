import { Modal } from "../../components/modal";
import { Input } from "../../components/input";
import { PrimaryButton, SecondaryButton } from "../../components/button";
import { Label } from "../../components/label";

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  presetName: string;
  onNameChange: (value: string) => void;
}

export function CreatePresetModal({
  isOpen,
  onClose,
  onSubmit,
  presetName,
  onNameChange,
}: CreatePresetModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 추가">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <Label>프리셋 이름</Label>
          <Input type="text" value={presetName} onChange={onNameChange} />
        </div>
        <div className="modal-actions">
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={!presetName.trim()}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
