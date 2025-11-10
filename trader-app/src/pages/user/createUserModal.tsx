import { Modal } from "@/components/modal";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { Error } from "@/components/error";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  formData: {
    nickname: string;
    riot_nickname: string;
    access_code: string;
  };
  onFormChange: (field: string, value: string) => void;
  isPending: boolean;
  error?: Error | null;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isPending,
  error,
}: CreateUserModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="유저 추가">
      <form onSubmit={onSubmit}>
        {error && <Error>유저 생성에 실패했습니다.</Error>}
        <div>
          <Label>닉네임</Label>
          <Input
            type="text"
            value={formData.nickname}
            onChange={(value) => onFormChange("nickname", value)}
          />
        </div>
        <div>
          <Label>롤 닉네임</Label>
          <Input
            type="text"
            value={formData.riot_nickname}
            onChange={(value) => onFormChange("riot_nickname", value)}
          />
        </div>
        <div>
          <Label>액세스 코드</Label>
          <Input
            type="text"
            value={formData.access_code}
            onChange={(value) => onFormChange("access_code", value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            추가
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
