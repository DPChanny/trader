import { UserCard } from "./userCard";
import { cva } from "class-variance-authority";
import type { UserItem } from "@/types";
import styles from "@/styles/components/userGrid.module.css";

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
  users: UserItem[];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
}

export function UserGrid({
  users,
  selectedUserId,
  onUserClick,
}: UserGridProps) {
  return (
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
            name={user.name}
            riot_id={user.riot_id}
            tier={user.tier}
            positions={user.positions}
            is_leader={user.is_leader}
          />
        </div>
      ))}
    </div>
  );
}
