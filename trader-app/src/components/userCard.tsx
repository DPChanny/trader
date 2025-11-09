import "./userCard.css";
import type { User } from "../types";

const DEFAULT_PHOTO = "https://via.placeholder.com/150?text=User";

export function UserCard({ nickname, riot_nickname, position, tier }: User) {
  return (
    <div class="user-card">
      <div class="user-photo">
        <img src={DEFAULT_PHOTO} alt={nickname} />
      </div>
      <div class="user-info">
        <h3 class="user-name">{nickname}</h3>
        <p class="user-riot-name">{riot_nickname}</p>
        <div class="user-details">
          {position && <span class="user-position">{position}</span>}
          {tier && <span class="user-tier">{tier}</span>}
        </div>
      </div>
    </div>
  );
}
