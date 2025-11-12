import { Modal } from "@/components/modal";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

import modalStyles from "@/styles/components/modal.module.css";

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
      <form onSubmit={onSubmit}>
        {error && <Error>유저 추가에 실패했습니다.</Error>}
        <div>
          <Label>이름</Label>
          <Input
            type="text"
            value={formData.name}
            onChange={(value) => onFormChange("name", value)}
          />
        </div>
        <div>
          <Label>Riot ID</Label>
          <Input
            type="text"
            value={formData.riot_id}
            onChange={(value) => onFormChange("riot_id", value)}
          />
        </div>
        <div>
          <Label>Discord ID</Label>
          <Input
            type="text"
            value={formData.discord_id}
            onChange={(value) => onFormChange("discord_id", value)}
          />
        </div>
        <div className={modalStyles.buttonRow}>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
