import { UserGrid } from "@/components/userGrid";
import { Loading } from "@/components/loading";
import { PrimaryButton, SecondaryButton } from "@/components/button";
import { usePresetDetail } from "@/hooks/usePresetApi";
import styles from "@/styles/pages/auction/auctionCard.module.css";

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
      <div
        className={`${styles.loading} bg-white rounded-xl shadow-md border-2 border-blue-200`}
      >
        <Loading />
      </div>
    );
  }

  if (!presetDetail) {
    return null;
  }

  const leaders = presetDetail.leaders.map((leader) => ({
    id: leader.user_id,
    nickname: leader.user.nickname,
    riot_nickname: leader.user.riot_nickname,
    is_leader: true,
  }));

  return (
    <div className={styles.auctionCard}>
      <div className={styles.status}>
        <span
          className={`px-3 py-1 rounded text-xs font-bold ${
            status.toLowerCase() === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>
      <div className={styles.header}>
        <h2 className="text-white text-lg font-bold">{presetDetail.name}</h2>
      </div>
      <div className={styles.leaders}>
        <h3 className="text-white/80 text-base font-semibold m-0 mb-4">
          팀장 목록
        </h3>
        <UserGrid users={leaders} onUserClick={() => {}} />
      </div>
      <div className={styles.actions}>
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
