import styles from "@/styles/components/userCard.module.css";
import { Badge } from "./badge";

const DEFAULT_PHOTO = "https://via.placeholder.com/140px?text=User";

interface UserCardProps {
  name: string;
  riot_id: string;
  tier?: string | null;
  positions?: string[] | null;
  is_leader?: boolean | null;
}

export function UserCard({
  name,
  riot_id,
  tier,
  positions,
  is_leader,
}: UserCardProps) {
  return (
    <div class={`user-card ${styles.card}`}>
      <div class={styles.card__badgesLeft}>
        {is_leader && <Badge variantColor="gold">L</Badge>}
        {tier && <Badge variantColor="red">{tier.charAt(0)}</Badge>}
      </div>
      {positions && positions.length > 0 && (
        <div class={styles.card__badgesRight}>
          {positions.map((pos) => (
            <Badge key={pos} variantColor="blue">
              {pos.charAt(0)}
            </Badge>
          ))}
        </div>
      )}
      <div class={styles.card__photo}>
        <img src={DEFAULT_PHOTO} alt={name} />
      </div>
      <div class={styles.card__info}>
        <h3 class={styles.card__name}>{name}</h3>
        <p class={styles.card__riotName}>{riot_id}</p>
      </div>
    </div>
  );
}
