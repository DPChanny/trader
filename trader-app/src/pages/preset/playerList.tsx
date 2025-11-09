import { UserCard } from "../../components/userCard";
import { AddButton } from "../../components/button";

interface AvailablePlayersProps {
  users: any[];
  onAddUser: (userId: number) => void;
}

export function AvailablePlayers({ users, onAddUser }: AvailablePlayersProps) {
  return (
    <div className="detail-section">
      <h3>플레이어 추가</h3>
      <div className="available-players">
        {users.length === 0 ? (
          <div className="no-players">추가 가능한 플레이어가 없습니다</div>
        ) : (
          users.map((user) => (
            <div
              key={user.user_id}
              className="available-player-card"
              onClick={() => onAddUser(user.user_id)}
            >
              <UserCard
                nickname={user.nickname}
                riot_nickname={user.riot_nickname}
              />
              <AddButton onClick={() => onAddUser(user.user_id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
