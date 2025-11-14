import { cn } from "@/lib/utils";
import styles from "@/styles/components/userCard.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "./badge";
import { Section } from "./section";
import { IconBadge } from "./iconBadge";
import type { PresetUserDetail } from "@/dtos";

const presetUserCardVariants = cva(styles.card, {
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

export interface PresetUserCardProps
  extends VariantProps<typeof presetUserCardVariants> {
  presetUser: PresetUserDetail;
}

export function PresetUserCard({ presetUser, variant }: PresetUserCardProps) {
  const { user, tier, positions, isLeader } = presetUser;

  const positionNames = positions?.map((p) => p.position.name) || [];

  return (
    <Section className={cn(presetUserCardVariants({ variant, isLeader }))}>
      <div class={styles.card__badgesLeft}>
        {variant === "detail" && (
          <Badge variantColor="gray">{`#${user.userId}`}</Badge>
        )}
      </div>
      <div class={styles.card__badgesRight}>
        {tier && <Badge variantColor="red">{tier.name.charAt(0)}</Badge>}
      </div>

      <Section variantTone="ghost" variantType="secondary">
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

        <Section variantTone="ghost" variantType="tertiary">
          <h3 class={styles.card__name}>{user.name}</h3>
          {variant === "detail" && user.riotId && (
            <div class={styles.card__riotId}>{user.riotId}</div>
          )}
          {positionNames && positionNames.length > 0 && (
            <Section
              variantTone="ghost"
              variantLayout="row"
              variantType="tertiary"
              className={styles.card__positions}
            >
              {positions!.map((p) =>
                p.position.iconUrl ? (
                  <IconBadge
                    variantSize="md"
                    key={p.position.positionId}
                    src={p.position.iconUrl}
                    alt={p.position.name}
                    variantColor="blue"
                  />
                ) : (
                  <Badge
                    variantSize="md"
                    key={p.position.positionId}
                    variantColor="blue"
                  >
                    {p.position.name.charAt(0)}
                  </Badge>
                )
              )}
            </Section>
          )}
        </Section>
      </Section>
    </Section>
  );
}
