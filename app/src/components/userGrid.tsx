import { UserCard, type UserCardProps } from "./userCard";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/userGrid.module.css";

const gridVariants = cva(styles.grid, {
  variants: {
    variant: {
      detail: styles.gridDetail,
      compact: styles.gridCompact,
    },
  },
  defaultVariants: {
    variant: "compact",
  },
});

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
  variant?: "detail" | "compact";
}

export function UserGrid({
  users,
  selectedUserId,
  onUserClick,
  variant = "compact",
}: UserGridProps) {
  return (
    <div className={cn(gridVariants({ variant }))}>
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
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}
