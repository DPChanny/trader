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
  const leaders = users.filter((user) => user.isLeader);
  const nonLeaders = users.filter((user) => !user.isLeader);
  const sortedUsers = [...leaders, ...nonLeaders];

  return (
    <div className={cn(gridVariants({ variant }))}>
      {sortedUsers.map((user) => (
        <div
          key={user.userId}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.userId,
          })}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard
            userId={user.userId}
            name={user.name}
            riotId={user.riotId}
            profileUrl={user.profileUrl}
            tier={user.tier}
            positions={user.positions}
            isLeader={user.isLeader}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}
