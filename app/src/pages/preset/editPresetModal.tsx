import { useState, useEffect } from "preact/hooks";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";
import styles from "@/styles/pages/preset/editPresetModal.module.css";

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
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <Error>프리셋 수정에 실패했습니다.</Error>}

        <div className={styles.inputGroup}>
          <Label>프리셋 이름</Label>
          <Input
            value={name}
            onChange={(value) => setName(value)}
            placeholder="프리셋 이름"
            autoFocus
          />
        </div>

        <div>
          <div className={styles.row}>
            <div className={styles.rowFull}>
              <Label>포인트</Label>
              <Input
                type="number"
                value={inputPoints.toString()}
                onChange={(value) => setInputPoints(Number(value) || 0)}
                placeholder="1000"
                variantIntent={isDivisible ? "default" : "error"}
              />
            </div>
            <div className={styles.rowFull}>
              <Label>포인트 스케일</Label>
              <Input
                type="number"
                value={pointScale.toString()}
                onChange={(value) =>
                  setPointScale(Math.max(1, Number(value) || 1))
                }
                placeholder="1"
              />
            </div>
          </div>
          {!isDivisible && (
            <div className={styles.errorContainer}>
              <Error>포인트는 포인트 스케일의 배수여야 합니다.</Error>
            </div>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.rowFull}>
            <Label>타이머 (초)</Label>
            <Input
              type="number"
              value={time.toString()}
              onChange={(value) => setTime(Number(value) || 0)}
              placeholder="30"
            />
          </div>
        </div>

        <div className={styles.buttonRow}>
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !name.trim() || !hasChanges || !isDivisible}
          >
            저장
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
