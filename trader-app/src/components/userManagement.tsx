import { useState, useEffect } from "preact/hooks";
import { userApi } from "../api/api";
import type { User } from "../types";
import "./userManagement.css";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nickname: "",
    riot_nickname: "",
    access_code: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getAll();
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsLoading(true);
    setError(null);

    try {
      if (editingUser) {
        await userApi.update(editingUser.user_id, formData);
      } else {
        await userApi.create(formData);
      }
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save user");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("정말 이 사용자를 삭제하시겠습니까?")) return;

    setIsLoading(true);
    setError(null);
    try {
      await userApi.delete(userId);
      await loadUsers();
    } catch (err) {
      setError("Failed to delete user");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="user-management">
      <div class="user-management-header">
        <h2>사용자 관리</h2>
        <button class="btn-primary" onClick={() => handleOpenModal()}>
          + 사용자 추가
        </button>
      </div>

      {error && <div class="error-message">{error}</div>}

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
                  <button
                    class="btn-edit"
                    onClick={() => handleOpenModal(user)}
                  >
                    수정
                  </button>
                  <button
                    class="btn-delete"
                    onClick={() => handleDelete(user.user_id)}
                  >
                    삭제
                  </button>
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
                <button
                  type="button"
                  class="btn-cancel"
                  onClick={handleCloseModal}
                >
                  취소
                </button>
                <button type="submit" class="btn-primary" disabled={isLoading}>
                  {editingUser ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
