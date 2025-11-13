import { cn } from "@/lib/utils";
import styles from "@/styles/components/userCard.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "./badge";
import { Section } from "./section";
import type { User } from "@/dtos";

const userCardVariants = cva(styles.card, {
  variants: {
    variant: {
      detail: styles.cardDetail,
      compact: styles.cardCompact,
    },
  },
  defaultVariants: {
    variant: "detail",
  },
});

export interface UserCardProps extends VariantProps<typeof userCardVariants> {
  user: User;
}

export function UserCard({ user, variant }: UserCardProps) {
  return (
    <Section
      variantType="tertiary"
      className={cn(userCardVariants({ variant }))}
    >
      <div class={styles.card__badgesLeft}>
        {variant === "detail" && (
          <Badge variantColor="gray">{`${user.userId}`}</Badge>
        )}
      </div>

      <div class={styles.card__content}>
        <div class={styles.card__profile}>
          {user.profileUrl ? (
            <img src={user.profileUrl} alt={user.name} />
          ) : (
            <svg
              class={styles.card__profileIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5" />
              <path
                d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          )}
        </div>

        <div
          class={
            variant === "detail"
              ? styles.card__spacerDetail
              : styles.card__spacerCompact
          }
        ></div>

        <div class={styles.card__info}>
          <h3 class={styles.card__name}>{user.name}</h3>
          {variant === "detail" && (
            <p class={styles.card__riotName}>{user.riotId}</p>
          )}
        </div>
      </div>
    </Section>
  );
}
