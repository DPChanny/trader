import { UserCard, type UserCardProps } from "./userCard";
import { cva } from "class-variance-authority";
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
  users: UserCardProps[];
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
          key={user.user_id}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.user_id,
          })}
          onClick={() => onUserClick(user.user_id)}
        >
          <UserCard
            user_id={user.user_id}
            name={user.name}
            riot_id={user.riot_id}
            profile_url={user.profile_url}
            tier={user.tier}
            positions={user.positions}
            is_leader={user.is_leader}
          />
        </div>
      ))}
    </div>
  );
}
