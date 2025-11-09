import { useState } from "preact/hooks";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../../hooks/useUserApi";
import type { User } from "../../types";
import {
  PrimaryButton,
  SecondaryButton,
  EditButton,
  DeleteButton,
} from "../../components/button";
import "./userPage.css";

export function UserPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nickname: "",
    riot_nickname: "",
    access_code: "",
  });

  // React Query hooks
  const { data: usersResponse, isLoading, error } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersResponse?.data ?? [];

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nickname: user.nickname,
        riot_nickname: user.riot_nickname,
        access_code: user.access_code ?? "",
      });
    } else {
      setEditingUser(null);
      setFormData({ nickname: "", riot_nickname: "", access_code: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ nickname: "", riot_nickname: "", access_code: "" });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          userId: editingUser.user_id,
          data: formData,
        });
      } else {
        await createUserMutation.mutateAsync(formData);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("정말 이 사용자를 삭제하시겠습니까?")) return;

    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const isMutating =
    createUserMutation.isPending ||
    updateUserMutation.isPending ||
    deleteUserMutation.isPending;

  return (
    <div class="user-management">
      <div class="user-management-header">
        <h2>사용자 관리</h2>
        <PrimaryButton onClick={() => handleOpenModal()}>
          + 사용자 추가
        </PrimaryButton>
      </div>

      {error && (
        <div class="error-message">
          {error instanceof Error ? error.message : "오류가 발생했습니다"}
        </div>
      )}

      {isLoading && <div class="loading">로딩 중...</div>}

      <div class="user-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>닉네임</th>
              <th>롤 닉네임</th>
              <th>액세스 코드</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.nickname}</td>
                <td>{user.riot_nickname}</td>
                <td>{user.access_code}</td>
                <td>
                  <EditButton onClick={() => handleOpenModal(user)} />
                  <DeleteButton onClick={() => handleDelete(user.user_id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div class="modal-overlay" onClick={handleCloseModal}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "사용자 수정" : "사용자 추가"}</h3>
            <form onSubmit={handleSubmit}>
              <div class="form-group">
                <label>닉네임</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      nickname: (e.target as HTMLInputElement).value,
                    })
                  }
                  required
                />
              </div>
              <div class="form-group">
                <label>롤 닉네임</label>
                <input
                  type="text"
                  value={formData.riot_nickname}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      riot_nickname: (e.target as HTMLInputElement).value,
                    })
                  }
                  required
                />
              </div>
              <div class="form-group">
                <label>액세스 코드</label>
                <input
                  type="text"
                  value={formData.access_code}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      access_code: (e.target as HTMLInputElement).value,
                    })
                  }
                  required
                />
              </div>
              <div class="modal-actions">
                <SecondaryButton onClick={handleCloseModal}>
                  취소
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isMutating}>
                  {editingUser ? "수정" : "추가"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
