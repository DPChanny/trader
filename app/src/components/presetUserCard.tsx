import {cn} from "@/lib/utils";
import styles from "@/styles/components/userCard.module.css";
import {cva, type VariantProps} from "class-variance-authority";
import {Badge} from "./badge";
import {Section} from "./section";
import {IconBadge} from "./iconBadge";
import type {PresetUserDetail} from "@/dtos";

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

// PresetUserDetail DTO 기반 + 프레젠테이션 관련 필드
export interface PresetUserCardProps extends VariantProps<typeof presetUserCardVariants> {
  presetUser: PresetUserDetail;
}

export function PresetUserCard({
                                 presetUser,
                                 variant,
                               }: PresetUserCardProps) {
  const {user, tier, positions, isLeader} = presetUser;

  const positionNames = positions?.map((p) => p.position.name) || [];

  return (
    <Section
      variantType="tertiary"
      className={cn(presetUserCardVariants({variant, isLeader: isLeader ?? false}))}
    >
      <div class={styles.card__badgesLeft}>
        {variant === "detail" && (
          <Badge variantColor="gray">{`#${user.userId}`}</Badge>
        )}
      </div>
      <div class={styles.card__badgesRight}>
        {tier && <Badge variantColor="red">{tier.name.charAt(0)}</Badge>}
      </div>

      <div class={styles.card__content}>
        <div class={styles.card__profile}>
          {user.profileUrl ? (
            <img src={user.profileUrl} alt={user.name}/>
          ) : (
            <svg
              class={styles.card__profileIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5"/>
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

        {positionNames && positionNames.length > 0 && (
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
              {positions!.map((p) => (
                p.position.iconUrl ? (
                  <IconBadge
                    key={p.position.positionId}
                    src={p.position.iconUrl}
                    alt={p.position.name}
                    variantColor="blue"
                  />
                ) : (
                  <Badge key={p.position.positionId} variantColor="blue">
                    {p.position.name.charAt(0)}
                  </Badge>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
