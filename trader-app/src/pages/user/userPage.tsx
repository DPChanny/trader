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
import "@/styles/pages/user/userPage.css";

export function UserPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Form state for adding new user
  const [formData, setFormData] = useState({
    nickname: "",
    riot_nickname: "",
    access_code: "",
  });

  // React Query hooks
  const { data: usersResponse, isLoading, error } = useUsers();
  const createUserMutation = useCreateUser();

  const users = usersResponse?.data ?? [];

  const userItems = users.map((user) => ({
    id: user.user_id,
    nickname: user.nickname,
    riot_nickname: user.riot_nickname,
  }));

  const selectedUser = selectedUserId
    ? users.find((user) => user.user_id === selectedUserId)
    : null;

  const handleCloseEditor = () => {
    setSelectedUserId(null);
  };

  const handleOpenModal = () => {
    setFormData({ nickname: "", riot_nickname: "", access_code: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ nickname: "", riot_nickname: "", access_code: "" });
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
    <div className="user-page">
      <div className="user-container">
        <Section variant="primary" className="user-list-container">
          <div className="user-page-header">
            <h2>유저 관리</h2>
            <PrimaryButton onClick={handleOpenModal}>추가</PrimaryButton>
          </div>
          <Bar variant="blue" />

          {error && <Error>유저 목록을 불러오는데 실패했습니다.</Error>}

          {isLoading && <Loading />}

          {!isLoading && !error && (
            <div className="user-grid-section">
              <UserGrid
                title="유저 목록"
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
