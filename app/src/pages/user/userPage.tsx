import { useState } from "preact/hooks";
import { useUsers, useAddUser } from "@/hooks/useUserApi";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { PageLayout, PageContainer } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { UserEditor } from "./userEditor";
import { AddUserModal } from "./addUserModal";

import styles from "@/styles/pages/user/userPage.module.css";
import { Bar } from "@/components/bar";

export function UserPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    riot_id: "",
    discord_id: "",
  });

  const { data: usersResponse, isLoading, error } = useUsers();
  const addUserMutation = useAddUser();

  const users = usersResponse?.data ?? [];

  const userItems = users.map((user) => ({
    user_id: user.user_id,
    name: user.name,
    riot_id: user.riot_id,
    profile_url: user.profile_url,
  }));

  const selectedUser = selectedUserId
    ? users.find((user) => user.user_id === selectedUserId)
    : null;

  const handleCloseEditor = () => {
    setSelectedUserId(null);
  };

  const handleOpenModal = () => {
    setFormData({ name: "", riot_id: "", discord_id: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", riot_id: "", discord_id: "" });
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
          {isLoading && (
            <Section variantTone="ghost" className={styles.loadingContainer}>
              <Loading />
            </Section>
          )}

          {!isLoading && !error && (
            <Section
              variantTone="ghost"
              variantLayout="grid"
              className={styles.gridSection}
            >
              <UserGrid
                users={userItems}
                selectedUserId={selectedUserId}
                onUserClick={(id) => setSelectedUserId(id as number)}
                variant="detail"
              />
            </Section>
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
