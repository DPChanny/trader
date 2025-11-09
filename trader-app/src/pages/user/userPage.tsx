import { useState } from "preact/hooks";
import { useUsers, useCreateUser } from "../../hooks/useUserApi";
import { PrimaryButton, SecondaryButton } from "../../components/button";
import { UserGrid } from "../../components/userGrid";
import { Input } from "../../components/input";
import { UserEditor } from "./userEditor";
import "./userPage.css";

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

  return (
    <div className="user-page">
      <div className="user-container">
        <div className="user-main-section">
          <div className="section-header">
            <h2>사용자 관리</h2>
            <PrimaryButton onClick={handleOpenModal}>추가</PrimaryButton>
          </div>

          {error && (
            <div className="error-message">
              {error instanceof Error ? error.message : "오류가 발생했습니다"}
            </div>
          )}

          {isLoading && <div className="loading">로딩 중...</div>}

          {!isLoading && (
            <UserGrid
              title="사용자"
              users={userItems}
              selectedUserId={selectedUserId}
              onUserClick={(id) => setSelectedUserId(id as number)}
            />
          )}
        </div>

        {selectedUser && (
          <UserEditor user={selectedUser} onClose={handleCloseEditor} />
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>사용자 추가</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>닉네임</label>
                <Input
                  type="text"
                  value={formData.nickname}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      nickname: value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>롤 닉네임</label>
                <Input
                  type="text"
                  value={formData.riot_nickname}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      riot_nickname: value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>액세스 코드</label>
                <Input
                  type="text"
                  value={formData.access_code}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      access_code: value,
                    })
                  }
                />
              </div>
              <div className="modal-actions">
                <SecondaryButton onClick={handleCloseModal}>
                  취소
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  추가
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
