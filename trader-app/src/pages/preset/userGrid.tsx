import { UserCard } from "../../components/userCard";

interface UserGridProps {
  users: any[];
  onAddUser: (userId: number) => void;
}

export function UserGrid({ users, onAddUser }: UserGridProps) {
  return (
    <div className="detail-section grid-section">
      <h3>유저 추가</h3>
      <div className="available-users-grid">
        {users.length === 0 ? (
          <div className="no-users">추가 가능한 유저가 없습니다</div>
        ) : (
          users.map((user) => (
            <div
              key={user.user_id}
              className="available-user-card"
              onClick={() => onAddUser(user.user_id)}
            >
              <UserCard
                nickname={user.nickname}
                riot_nickname={user.riot_nickname}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
