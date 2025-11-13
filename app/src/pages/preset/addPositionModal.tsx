import {Modal, ModalFooter, ModalForm} from "@/components/modal";
import {LabelInput} from "@/components/labelInput";
import {PrimaryButton, SecondaryButton} from "@/components/button";
import {Error} from "@/components/error";

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  positionName: string;
  positionIconUrl: string;
  onNameChange: (value: string) => void;
  onIconUrlChange: (value: string) => void;
  isPending?: boolean;
  error?: Error | null;
}

export function AddPositionModal({
                                   isOpen,
                                   onClose,
                                   onSubmit,
                                   positionName,
                                   positionIconUrl,
                                   onNameChange,
                                   onIconUrlChange,
                                   isPending = false,
                                   error,
                                 }: AddPositionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="포지션 추가">
      <ModalForm onSubmit={onSubmit}>
        {error && <Error>포지션 추가에 실패했습니다.</Error>}
        <LabelInput
          label="포지션 이름"
          type="text"
          value={positionName}
          onChange={onNameChange}
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
          type="text"
          value={positionIconUrl}
          onChange={onIconUrlChange}
        />
        <ModalFooter>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !positionName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
