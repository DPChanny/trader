import { useState, useEffect } from "preact/hooks";
import { UserCard } from "../../components/userCard";
import { useUpdateUser, useDeleteUser } from "../../hooks/useUserApi";
import { CloseButton, DangerButton, SaveButton } from "../../components/button";
import { Input } from "../../components/input";
import type { User } from "../../types";

interface UserEditorProps {
  user: User;
  onClose: () => void;
}

export function UserEditor({ user, onClose }: UserEditorProps) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [nickname, setNickname] = useState(user.nickname);
  const [riotNickname, setRiotNickname] = useState(user.riot_nickname);
  const [accessCode, setAccessCode] = useState(user.access_code ?? "");

  // user가 변경될 때마다 상태를 다시 초기화
  useEffect(() => {
    setNickname(user.nickname);
    setRiotNickname(user.riot_nickname);
    setAccessCode(user.access_code ?? "");
  }, [user.user_id, user.nickname, user.riot_nickname, user.access_code]);

  const hasChanges =
    nickname !== user.nickname ||
    riotNickname !== user.riot_nickname ||
    accessCode !== (user.access_code ?? "");

  const handleSave = async () => {
    await updateUser.mutateAsync({
      userId: user.user_id,
      data: {
        nickname,
        riot_nickname: riotNickname,
        access_code: accessCode,
      },
    });
  };

  const handleDeleteUser = async () => {
    if (!confirm("정말 이 사용자를 삭제하시겠습니까?")) return;
    await deleteUser.mutateAsync(user.user_id);
    onClose();
  };

  return (
    <div className="user-edit-panel">
      <div className="edit-panel-header">
        <h3>{user.nickname}</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <SaveButton onClick={handleSave} disabled={!hasChanges} />
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <div className="edit-panel-content">
        <UserCard nickname={nickname} riot_nickname={riotNickname} />

        <div className="edit-section">
          <label className="edit-label">닉네임</label>
          <Input
            type="text"
            value={nickname}
            onChange={setNickname}
            className="edit-input"
          />
        </div>

        <div className="edit-section">
          <label className="edit-label">롤 닉네임</label>
          <Input
            type="text"
            value={riotNickname}
            onChange={setRiotNickname}
            className="edit-input"
          />
        </div>

        <div className="edit-section">
          <label className="edit-label">액세스 코드</label>
          <Input
            type="text"
            value={accessCode}
            onChange={setAccessCode}
            className="edit-input"
          />
        </div>

        <DangerButton onClick={handleDeleteUser}>사용자 삭제</DangerButton>
      </div>
    </div>
  );
}
