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

  const [name, setName] = useState(user.name);
  const [riotId, setRiotId] = useState(user.riot_id);
  const [discordId, setDiscordId] = useState(user.discord_id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(user.name);
    setRiotId(user.riot_id);
    setDiscordId(user.discord_id);
  }, [user.user_id, user.name, user.riot_id, user.discord_id]);

  const hasChanges =
    name !== user.name ||
    riotId !== user.riot_id ||
    discordId !== user.discord_id;

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        userId: user.user_id,
        data: {
          name,
          riot_id: riotId,
          discord_id: discordId,
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
        <h3 className={styles.headerTitle}>{user.name}</h3>
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
          <UserCard
            user_id={user.user_id}
            name={name}
            riot_id={riotId}
            profile_url={user.profile_url}
          />
        </div>

        <div className={styles.section}>
          <Label>이름</Label>
          <Input type="text" value={name} onChange={setName} />
        </div>

        <div className={styles.section}>
          <Label>Riot ID</Label>
          <Input type="text" value={riotId} onChange={setRiotId} />
        </div>

        <div className={styles.section}>
          <Label>Discord ID</Label>
          <Input type="text" value={discordId} onChange={setDiscordId} />
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
