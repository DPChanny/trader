import { Modal, ModalForm, ModalFooter } from "@/components/modal";
import { LabelInput } from "@/components/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

interface AddPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  presetName: string;
  onNameChange: (value: string) => void;
  points: number;
  onPointsChange: (value: string) => void;
  time: number;
  onTimeChange: (value: string) => void;
  isPending?: boolean;
  error?: Error | null;
}

export function AddPresetModal({
  isOpen,
  onClose,
  onSubmit,
  presetName,
  onNameChange,
  points: pointsPerTeam,
  onPointsChange,
  time: timerDuration,
  onTimeChange: onTimerChange,
  isPending = false,
  error,
}: AddPresetModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 추가">
      <ModalForm onSubmit={onSubmit}>
        {error && <Error>프리셋 추가에 실패했습니다.</Error>}
        <LabelInput
          label="프리셋 이름"
          type="text"
          value={presetName}
          onChange={onNameChange}
        />
        <LabelInput
          label="팀당 포인트"
          type="number"
          value={pointsPerTeam.toString()}
          onChange={onPointsChange}
        />
        <LabelInput
          label="경매 타이머 (초)"
          type="number"
          value={timerDuration.toString()}
          onChange={onTimerChange}
        />
        <ModalFooter>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !presetName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
