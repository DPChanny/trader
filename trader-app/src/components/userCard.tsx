import "@/styles/components/userCard.css";
import { Badge } from "./badge";

const DEFAULT_PHOTO = "https://via.placeholder.com/150?text=User";

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
    <div class="user-card">
      <div class="user-badges">
        {is_leader && <Badge variantColor="gold">L</Badge>}
        {tier && <Badge variantColor="red">{tier.charAt(0)}</Badge>}
        {positions?.map((pos) => (
          <Badge key={pos} variantColor="blue">
            {pos.charAt(0)}
          </Badge>
        ))}
      </div>
      <div class="user-photo">
        <img src={DEFAULT_PHOTO} alt={nickname} />
      </div>
      <div class="user-info">
        <h3 class="user-name">{nickname}</h3>
        <p class="user-riot-name">{riot_nickname}</p>
      </div>
    </div>
  );
}
