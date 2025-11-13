import { Modal, ModalForm, ModalFooter, ModalRow } from "@/components/modal";
import { LabelInput } from "@/components/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";
import { Toggle } from "@/components/toggle";
import { Label } from "@/components/label";
import { Section } from "@/components/section";
import type { Statistics } from "@/dtos";

interface AddPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  presetName: string;
  onNameChange: (value: string) => void;
  points: number;
  onPointsChange: (value: string) => void;
  pointScale: number;
  onPointScaleChange: (value: string) => void;
  time: number;
  onTimeChange: (value: string) => void;
  statistics: Statistics;
  onStatisticsChange: (value: Statistics) => void;
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
  pointScale,
  onPointScaleChange,
  time: timerDuration,
  onTimeChange: onTimerChange,
  statistics,
  onStatisticsChange,
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
        <ModalRow>
          <LabelInput
            label="팀당 포인트"
            type="number"
            value={pointsPerTeam.toString()}
            onChange={onPointsChange}
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale.toString()}
            onChange={onPointScaleChange}
          />
        </ModalRow>
        <LabelInput
          label="경매 타이머 (초)"
          type="number"
          value={timerDuration.toString()}
          onChange={onTimerChange}
        />
        <Section variantTone="ghost" variantType="tertiary">
          <Label>통계</Label>
          <Section variantLayout="row" variantType="tertiary">
            <Toggle
              type="button"
              active={statistics === "NONE"}
              onClick={() => onStatisticsChange("NONE")}
            >
              NONE
            </Toggle>
            <Toggle
              type="button"
              active={statistics === "LOL"}
              onClick={() => onStatisticsChange("LOL")}
            >
              LOL
            </Toggle>
            <Toggle
              type="button"
              active={statistics === "VAL"}
              onClick={() => onStatisticsChange("VAL")}
            >
              VAL
            </Toggle>
          </Section>
        </Section>
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
