import { UserCard } from "./userCard";
import { cva } from "class-variance-authority";
import styles from "@/styles/components/userGrid.module.css";

interface UserItem {
  id: number | string;
  nickname: string;
  riot_nickname: string;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}

const gridItemVariants = cva(styles.grid__item, {
  variants: {
    variantSelected: {
      true: styles["grid__item--selected"],
      false: "",
    },
  },
  defaultVariants: {
    variantSelected: false,
  },
});

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
    <div className={styles.container}>
      <h3 className={styles.container__title}>{title}</h3>
      <div className={styles.grid}>
        {users.map((user) => (
          <div
            key={user.id}
            className={gridItemVariants({
              variantSelected: selectedUserId === user.id,
            })}
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
