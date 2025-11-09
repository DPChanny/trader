import "./player.css";

export interface PlayerProps {
  name: string;
  photo: string;
  position?: string;
  tier?: string;
}

export function Player({ name, photo, position, tier }: PlayerProps) {
  return (
    <div class="player-card">
      <div class="player-photo">
        <img src={photo} alt={name} />
      </div>
      <div class="player-info">
        <h3 class="player-name">{name}</h3>
        <div class="player-details">
          {position && <span class="player-position">{position}</span>}
          {tier && <span class="player-tier">{tier}</span>}
        </div>
      </div>
    </div>
  );
}
