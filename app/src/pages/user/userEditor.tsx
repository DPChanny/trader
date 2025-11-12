import { useState, useEffect } from "react";
import { UserCard } from "@/components/userCard";
import { useUpdateUser, useDeleteUser } from "@/hooks/useUserApi";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { LabelInput } from "@/components/labelInput";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import { ConfirmModal } from "@/components/modal";
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
    <Section variantType="primary" className={styles.panel}>
      <Section variantTone="ghost" variantLayout="row">
        <h3>{user.name}</h3>
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantType="secondary"
        >
          <SaveButton
            onClick={handleSave}
            disabled={updateUser.isPending || !hasChanges}
          />
          <CloseButton onClick={onClose} />
        </Section>
      </Section>
      <Bar />

      {updateUser.isError && <Error>유저 정보 수정에 실패했습니다.</Error>}
      {deleteUser.isError && <Error>유저 삭제에 실패했습니다.</Error>}

      <Section variantTone="ghost">
        <Section variantTone="ghost" className={styles.cardSection}>
          <UserCard
            user_id={user.user_id}
            name={name}
            riot_id={riotId}
            profile_url={user.profile_url}
            variant="detail"
          />
        </Section>

        <LabelInput label="이름" value={name} onChange={setName} />
        <LabelInput label="Riot ID" value={riotId} onChange={setRiotId} />
        <LabelInput
          label="Discord ID"
          value={discordId}
          onChange={setDiscordId}
        />

        <DangerButton
          variantSize="lg"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteUser.isPending}
        >
          유저 삭제
        </DangerButton>
      </Section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="유저 삭제"
        message="정말 이 유저를 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deleteUser.isPending}
      />
    </Section>
  );
}
