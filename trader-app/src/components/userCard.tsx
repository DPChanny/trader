import styles from "@/styles/components/userCard.module.css";
import { Badge } from "./badge";

const DEFAULT_PHOTO = "https://via.placeholder.com/140px?text=User";

interface UserCardProps {
  nickname: string;
  riot_nickname: string;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}

export function UserCard({
  nickname,
  riot_nickname,
  tier,
  positions,
  is_leader,
}: UserCardProps) {
  return (
    <div class={`user-card ${styles.card}`}>
      <div class={styles.card__badges}>
        {is_leader && <Badge variantColor="gold">L</Badge>}
        {tier && <Badge variantColor="red">{tier.charAt(0)}</Badge>}
        {positions?.map((pos) => (
          <Badge key={pos} variantColor="blue">
            {pos.charAt(0)}
          </Badge>
        ))}
      </div>
      <div class={styles.card__photo}>
        <img src={DEFAULT_PHOTO} alt={nickname} />
      </div>
      <div class={styles.card__info}>
        <h3 class={styles.card__name}>{nickname}</h3>
        <p class={styles.card__riotName}>{riot_nickname}</p>
      </div>
    </div>
  );
}
