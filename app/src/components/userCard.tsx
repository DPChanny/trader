import { cn } from "@/lib/utils";
import styles from "@/styles/components/userCard.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "./badge";

const userCardVariants = cva(styles.card, {
  variants: {
    variant: {
      detail: styles.cardDetail,
      compact: styles.cardCompact,
    },
    isLeader: {
      true: styles.cardLeader,
      false: "",
    },
  },
  defaultVariants: {
    variant: "detail",
    isLeader: false,
  },
});

export interface UserCardProps extends VariantProps<typeof userCardVariants> {
  user_id: number;
  name: string;
  riot_id: string;
  profile_url?: string | null;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}

export function UserCard({
  user_id,
  name,
  riot_id,
  profile_url,
  tier,
  positions,
  is_leader,
  variant = "detail",
}: UserCardProps) {
  return (
    <div
      class={cn(userCardVariants({ variant, isLeader: is_leader ?? false }))}
    >
      <div class={styles.card__badgesLeft}>
        {variant === "detail" && (
          <Badge variantColor="gray">{`#${user_id}`}</Badge>
        )}
      </div>
      <div class={styles.card__badgesRight}>
        {tier && <Badge variantColor="red">{tier.charAt(0)}</Badge>}
      </div>

      <div class={styles.card__content}>
        <div class={styles.card__profile}>
          {profile_url ? (
            <img src={profile_url} alt={name} />
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
          <h3 class={styles.card__name}>{name}</h3>
          {variant === "detail" && (
            <p class={styles.card__riotName}>{riot_id}</p>
          )}
        </div>

        {positions && positions.length > 0 && (
          <>
            <div
              class={
                variant === "detail"
                  ? styles.card__spacerDetail
                  : styles.card__spacerCompact
              }
            ></div>

            <div
              class={cn(
                styles.card__positionBadges,
                variant === "detail"
                  ? styles.card__positionBadgesDetail
                  : styles.card__positionBadgesCompact
              )}
            >
              {positions.map((pos) => (
                <Badge key={pos} variantColor="blue">
                  {pos.charAt(0)}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
