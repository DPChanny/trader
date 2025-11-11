import { useState, useEffect } from "react";
import { UserCard } from "@/components/userCard";
import { useUpdateUser, useDeleteUser } from "@/hooks/useUserApi";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { ConfirmModal } from "@/components/confirmModal";
import type { User } from "@/types";

import styles from "@/styles/pages/user/userEditor.module.css";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    try {
      await updateUser.mutateAsync({
        userId: user.user_id,
        data: {
          nickname,
          riot_nickname: riotNickname,
          access_code: accessCode,
        },
      });
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync(user.user_id);
      onClose();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>{user.nickname}</h3>
        <div className="flex gap-2 items-center">
          <SaveButton onClick={handleSave} disabled={!hasChanges} />
          <CloseButton onClick={onClose} />
        </div>
      </div>
      <Bar variantColor="blue" />

      {updateUser.isError && <Error>유저 정보 수정에 실패했습니다.</Error>}
      {deleteUser.isError && <Error>유저 삭제에 실패했습니다.</Error>}

      <div className={styles.content}>
        <div className="flex justify-center">
          <UserCard nickname={nickname} riot_nickname={riotNickname} />
        </div>

        <div className={styles.section}>
          <Label>닉네임</Label>
          <Input type="text" value={nickname} onChange={setNickname} />
        </div>

        <div className={styles.section}>
          <Label>롤 닉네임</Label>
          <Input type="text" value={riotNickname} onChange={setRiotNickname} />
        </div>

        <div className={styles.section}>
          <Label>액세스 코드</Label>
          <Input type="text" value={accessCode} onChange={setAccessCode} />
        </div>

        <DangerButton onClick={() => setShowDeleteConfirm(true)}>
          유저 삭제
        </DangerButton>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="유저 삭제"
        message="정말 이 유저를 삭제하시겠습니까?"
        confirmText="삭제"
      />
    </div>
  );
}
