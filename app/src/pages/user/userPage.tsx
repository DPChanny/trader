import { useState, useMemo } from "preact/hooks";
import { useUsers, useAddUser } from "@/hooks/useUserApi";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { PageLayout, PageContainer } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { UserEditor } from "./userEditor";
import { AddUserModal } from "./addUserModal";
import type { User } from "@/dtos";

import styles from "@/styles/pages/user/userPage.module.css";
import { Bar } from "@/components/bar";

interface UserPageProps {
  path?: string;
}

export function UserPage({}: UserPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    riotId: "",
    discordId: "",
  });

  const { data: users, isLoading, error } = useUsers();
  const addUserMutation = useAddUser();

  const selectedUser = useMemo(
    () =>
      selectedUserId && users
        ? users.find((user: User) => user.userId === selectedUserId)
        : null,
    [selectedUserId, users]
  );

  const handleCloseEditor = () => {
    setSelectedUserId(null);
  };

  const handleOpenModal = () => {
    setFormData({ name: "", riotId: "", discordId: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", riotId: "", discordId: "" });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      await addUserMutation.mutateAsync(formData);
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <PageLayout>
      <PageContainer>
        <Section variantType="primary" className={styles.mainSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>유저 목록</h3>
            <PrimaryButton onClick={handleOpenModal}>추가</PrimaryButton>
          </Section>
          <Bar />
          {error && <Error>유저 목록을 불러오는데 실패했습니다.</Error>}
          {isLoading && <Loading />}
          {!isLoading && !error && (
            <UserGrid
              users={users || []}
              selectedUserId={selectedUserId}
              onUserClick={(id) => setSelectedUserId(id as number)}
              variant="detail"
            />
          )}

          {selectedUser && (
            <UserEditor user={selectedUser} onClose={handleCloseEditor} />
          )}
        </Section>
      </PageContainer>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        onFormChange={handleFormChange}
        isPending={addUserMutation.isPending}
        error={addUserMutation.error}
      />
    </PageLayout>
  );
}
