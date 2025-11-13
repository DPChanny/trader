import {UserCard} from "./userCard";
import {cva} from "class-variance-authority";
import {cn} from "@/lib/utils";
import styles from "@/styles/components/userGrid.module.css";
import type {User} from "@/dtos";

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
  users: User[]; // 순수 User DTO 배열
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
    <div className={cn(gridVariants({variant}))}>
      {users.map((user) => (
        <div
          key={user.userId}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.userId,
          })}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard user={user} variant={variant}/>
        </div>
      ))}
    </div>
  );
}
