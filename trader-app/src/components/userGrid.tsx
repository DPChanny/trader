import { UserCard } from "./userCard";

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
  count?: number;
  users: UserItem[];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
  className?: string;
}

export function UserGrid({
  title,
  count,
  users,
  selectedUserId,
  onUserClick,
  className = "",
}: UserGridProps) {
  return (
    <div className={`detail-section grid-section ${className}`}>
      <h3>
        {title}
        {count !== undefined && ` (${count}명)`}
      </h3>
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
