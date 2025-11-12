import { useState, useEffect } from "preact/hooks";
import { Modal, ModalForm, ModalFooter, ModalRow } from "@/components/modal";
import { LabelInput } from "@/components/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";
import modalStyles from "@/styles/components/modal.module.css";

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    points: number,
    time: number,
    pointScale: number
  ) => void;
  presetId: number | null;
  name: string;
  points: number;
  time: number;
  pointScale: number;
  isPending?: boolean;
  error?: any;
}

export function EditPresetModal({
  isOpen,
  onClose,
  onSubmit,
  name: propName,
  points: propPoints,
  time: propTime,
  pointScale: propPointScale,
  isPending = false,
  error,
}: EditPresetModalProps) {
  const [name, setName] = useState(propName);
  const [inputPoints, setInputPoints] = useState(propPoints * propPointScale);
  const [time, setTime] = useState(propTime);
  const [pointScale, setPointScale] = useState(propPointScale);

  useEffect(() => {
    if (isOpen) {
      setName(propName);
      setInputPoints(propPoints * propPointScale);
      setTime(propTime);
      setPointScale(propPointScale);
    }
  }, [isOpen, propName, propPoints, propTime, propPointScale]);

  const isDivisible = inputPoints % pointScale === 0;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim() || pointScale <= 0 || !isDivisible) return;
    const actualPoints = inputPoints / pointScale;
    onSubmit(name.trim(), actualPoints, time, pointScale);
  };

  const hasChanges =
    name !== propName ||
    inputPoints !== propPoints * propPointScale ||
    time !== propTime ||
    pointScale !== propPointScale;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error && <Error>프리셋 수정에 실패했습니다.</Error>}
        <LabelInput
          label="프리셋 이름"
          value={name}
          onChange={(value) => setName(value)}
          placeholder="프리셋 이름"
          autoFocus
        />
        <div>
          <ModalRow>
            <LabelInput
              label="포인트"
              type="number"
              value={inputPoints.toString()}
              onChange={(value) => setInputPoints(Number(value) || 0)}
              placeholder="1000"
              variantIntent={isDivisible ? "default" : "error"}
            />
            <LabelInput
              label="포인트 스케일"
              type="number"
              value={pointScale.toString()}
              onChange={(value) =>
                setPointScale(Math.max(1, Number(value) || 1))
              }
              placeholder="1"
            />
          </ModalRow>
          {!isDivisible && (
            <div className={modalStyles.errorContainer}>
              <Error>포인트는 포인트 스케일의 배수여야 합니다.</Error>
            </div>
          )}
        </div>

        <LabelInput
          label="타이머 (초)"
          type="number"
          value={time.toString()}
          onChange={(value) => setTime(Number(value) || 0)}
          placeholder="30"
        />

        <ModalFooter>
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !name.trim() || !hasChanges || !isDivisible}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
