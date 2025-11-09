import { UserCard } from "../../components/userCard";
import type { User } from "../../types";

interface UserGridProps {
  users: User[];
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
}

export function UserGrid({
  users,
  selectedUserId,
  onSelectUser,
}: UserGridProps) {
  return (
    <div className="user-grid">
      {users.map((user) => (
        <div
          key={user.user_id}
          className={`user-grid-item ${
            selectedUserId === user.user_id ? "selected" : ""
          }`}
          onClick={() => onSelectUser(user.user_id)}
        >
          <UserCard
            nickname={user.nickname}
            riot_nickname={user.riot_nickname}
          />
        </div>
      ))}
    </div>
  );
}
