import { useState } from "preact/hooks";
import { useUsers, useCreateUser } from "@/hooks/useUserApi";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { UserEditor } from "./userEditor";
import { CreateUserModal } from "./createUserModal";

import styles from "@/styles/pages/user/userPage.module.css";

export function UserPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    riot_id: "",
    discord_id: "",
  });

  const { data: usersResponse, isLoading, error } = useUsers();
  const createUserMutation = useCreateUser();

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
      await createUserMutation.mutateAsync(formData);
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
    <div className={styles.page}>
      <div className={styles.container}>
        <Section variant="primary" className={styles.listContainer}>
          <div className={styles.pageHeader}>
            <h2 className="text-white text-2xl font-semibold m-0">유저 관리</h2>
            <PrimaryButton onClick={handleOpenModal}>추가</PrimaryButton>
          </div>
          <Bar variantColor="blue" />

          {error && <Error>유저 목록을 불러오는데 실패했습니다.</Error>}

          {isLoading && <Loading />}

          {!isLoading && !error && (
            <div className={styles.gridSection}>
              <UserGrid
                users={userItems}
                selectedUserId={selectedUserId}
                onUserClick={(id) => setSelectedUserId(id as number)}
              />
            </div>
          )}
        </Section>

        {selectedUser && (
          <UserEditor user={selectedUser} onClose={handleCloseEditor} />
        )}
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        onFormChange={handleFormChange}
        isPending={createUserMutation.isPending}
        error={createUserMutation.error}
      />
    </div>
  );
}
