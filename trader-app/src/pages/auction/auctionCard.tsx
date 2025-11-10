import { UserCard } from "@/components/userCard";
import { Loading } from "@/components/loading";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { usePresetDetail } from "@/hooks/usePresetApi";
import "./auctionCard.css";

interface AuctionCardProps {
  presetId: number;
  sessionId: string;
  status: string;
  onJoinAsObserver?: (sessionId: string) => void;
  onJoinAsLeader?: (sessionId: string) => void;
}

export function AuctionCard({
  presetId,
  sessionId,
  status,
  onJoinAsObserver,
  onJoinAsLeader,
}: AuctionCardProps) {
  const { data: presetDetail, isLoading } = usePresetDetail(presetId);

  if (isLoading) {
    return (
      <div className="auction-card loading">
        <Loading />
      </div>
    );
  }

  if (!presetDetail) {
    return null;
  }

  const leaders = presetDetail.leaders.map((leader) => ({
    user_id: leader.user_id,
    nickname: leader.user.nickname,
    riot_nickname: leader.user.riot_nickname,
  }));

  return (
    <div className="auction-card">
      <div className="auction-card-status">
        <span className={`auction-status ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>
      <div className="auction-card-header">
        <h2>{presetDetail.name}</h2>
      </div>
      <div className="auction-card-leaders">
        <h3>팀장 목록</h3>
        <div className="leaders-grid">
          {leaders.map((leader) => (
            <div key={leader.user_id} className="leader-item">
              <UserCard
                nickname={leader.nickname}
                riot_nickname={leader.riot_nickname}
                is_leader={true}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="auction-card-actions">
        <SecondaryButton onClick={() => onJoinAsObserver?.(sessionId)}>
          관전자로 참가
        </SecondaryButton>
        <PrimaryButton onClick={() => onJoinAsLeader?.(sessionId)}>
          팀장으로 참가
        </PrimaryButton>
      </div>
    </div>
  );
}
