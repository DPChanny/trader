import { Modal, ModalForm, ModalFooter } from "@/components/modal";
import { LabelInput } from "@/components/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  formData: {
    name: string;
    riot_id: string;
    discord_id: string;
  };
  onFormChange: (field: string, value: string) => void;
  isPending: boolean;
  error?: Error | null;
}

export function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isPending,
  error,
}: AddUserModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="유저 추가">
      <ModalForm onSubmit={onSubmit}>
        {error && <Error>유저 추가에 실패했습니다.</Error>}
        <LabelInput
          label="이름"
          type="text"
          value={formData.name}
          onChange={(value) => onFormChange("name", value)}
        />
        <LabelInput
          label="Riot ID"
          type="text"
          value={formData.riot_id}
          onChange={(value) => onFormChange("riot_id", value)}
        />
        <LabelInput
          label="Discord ID"
          type="text"
          value={formData.discord_id}
          onChange={(value) => onFormChange("discord_id", value)}
        />
        <ModalFooter>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
