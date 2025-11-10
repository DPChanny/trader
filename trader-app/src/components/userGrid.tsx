import { UserCard } from "./userCard";
import "./userGrid.css";

interface UserItem {
  id: number | string;
  nickname: string;
  riot_nickname: string;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}

interface UserGridProps {
  title: string;
  users: UserItem[];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
}

export function UserGrid({
  title,
  users,
  selectedUserId,
  onUserClick,
}: UserGridProps) {
  return (
    <div className="user-grid-container">
      <h3>{title}</h3>
      <div className="user-grid">
        {users.map((user) => (
          <div
            key={user.id}
            className={`user-grid-item ${
              selectedUserId === user.id ? "selected" : ""
            }`}
            onClick={() => onUserClick(user.id)}
          >
            <UserCard
              nickname={user.nickname}
              riot_nickname={user.riot_nickname}
              tier={user.tier}
              positions={user.positions}
              is_leader={user.is_leader}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
