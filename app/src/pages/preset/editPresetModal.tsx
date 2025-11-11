import { useState, useEffect } from "preact/hooks";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, points: number, time: number) => void;
  presetId: number | null;
  initialName: string;
  initialPoints: number;
  initialTime: number;
  error?: any;
}

export function EditPresetModal({
  isOpen,
  onClose,
  onSubmit,
  initialName,
  initialPoints,
  initialTime,
  error,
}: EditPresetModalProps) {
  const [name, setName] = useState(initialName);
  const [points, setPoints] = useState(initialPoints);
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPoints(initialPoints);
      setTime(initialTime);
    }
  }, [isOpen, initialName, initialPoints, initialTime]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), points, time);
  };

  const hasChanges =
    name !== initialName || points !== initialPoints || time !== initialTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 수정">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Error>프리셋 수정에 실패했습니다.</Error>}

        <div>
          <Label>프리셋 이름</Label>
          <Input
            value={name}
            onChange={(value) => setName(value)}
            placeholder="프리셋 이름"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label>포인트</Label>
            <Input
              type="number"
              value={points.toString()}
              onChange={(value) => setPoints(Number(value) || 0)}
              placeholder="1000"
            />
          </div>
          <div className="flex-1">
            <Label>타이머 (초)</Label>
            <Input
              type="number"
              value={time.toString()}
              onChange={(value) => setTime(Number(value) || 0)}
              placeholder="30"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={!name.trim() || !hasChanges}>
            저장
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
