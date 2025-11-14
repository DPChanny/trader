import { UserCard } from "./userCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/userGrid.module.css";
import type { User } from "@/dtos";

const gridVariants = cva(styles.grid, {
  variants: {
    variant: {
      detail: styles["grid--detail"],
      compact: styles["grid--compact"],
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
  users: User[];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
  variant?: "detail" | "compact";
  className?: string;
}

export function UserGrid({
  users,
  selectedUserId,
  onUserClick,
  variant = "compact",
  className,
}: UserGridProps) {
  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={cn(gridVariants({ variant }), className)}
    >
      {users.map((user) => (
        <div
          key={user.userId}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.userId,
          })}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard user={user} variant={variant} />
        </div>
      ))}
    </Section>
  );
}
