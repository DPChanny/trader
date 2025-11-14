import { PresetUserCard, type PresetUserCardProps } from "./presetUserCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/userGrid.module.css";

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

interface PresetUserGridProps {
  presetUsers: PresetUserCardProps["presetUser"][];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
  variant?: "detail" | "compact";
  className?: string;
}

export function PresetUserGrid({
  presetUsers,
  selectedUserId,
  onUserClick,
  variant = "compact",
  className,
}: PresetUserGridProps) {
  const leaders = presetUsers.filter((pu) => pu.isLeader);
  const nonLeaders = presetUsers.filter((pu) => !pu.isLeader);
  const sortedUsers = [...leaders, ...nonLeaders];

  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={cn(gridVariants({ variant }), className)}
    >
      {sortedUsers.map((presetUser) => (
        <div
          key={presetUser.presetUserId}
          className={gridItemVariants({
            variantSelected: selectedUserId === presetUser.presetUserId,
          })}
          onClick={() => onUserClick(presetUser.presetUserId)}
        >
          <PresetUserCard presetUser={presetUser} variant={variant} />
        </div>
      ))}
    </Section>
  );
}
