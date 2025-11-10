import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  presetName: string;
  onNameChange: (value: string) => void;
  pointsPerTeam: number;
  onPointsChange: (value: string) => void;
  timerDuration: number;
  onTimerChange: (value: string) => void;
  error?: Error | null;
}

export function CreatePresetModal({
  isOpen,
  onClose,
  onSubmit,
  presetName,
  onNameChange,
  pointsPerTeam,
  onPointsChange,
  timerDuration,
  onTimerChange,
  error,
}: CreatePresetModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 추가">
      <form onSubmit={onSubmit}>
        {error && <Error>프리셋 생성에 실패했습니다.</Error>}
        <div className="flex flex-col gap-4">
          <div>
            <Label>프리셋 이름</Label>
            <Input type="text" value={presetName} onChange={onNameChange} />
          </div>
          <div>
            <Label>팀당 포인트</Label>
            <Input
              type="number"
              value={pointsPerTeam.toString()}
              onChange={onPointsChange}
            />
          </div>
          <div>
            <Label>경매 타이머 (초)</Label>
            <Input
              type="number"
              value={timerDuration.toString()}
              onChange={onTimerChange}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={!presetName.trim()}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
