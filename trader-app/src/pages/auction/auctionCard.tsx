import { UserGrid } from "@/components/userGrid";
import { Loading } from "@/components/loading";
import { Bar } from "@/components/bar";
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

  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "waiting") return "접속 대기 중";
    if (statusLower === "in_progress") return "경매 진행 중";
    if (statusLower === "completed") return "경매 완료";
    return status;
  };

  return (
    <div className={styles.auctionCard}>
      <div className={styles.status}>
        <span
          className={`${styles.statusBadge} ${
            status.toLowerCase() === "in_progress"
              ? styles["statusBadge--active"]
              : status.toLowerCase() === "waiting"
              ? styles["statusBadge--waiting"]
              : styles["statusBadge--inactive"]
          }`}
        >
          {getStatusText(status)}
        </span>
      </div>
      <div className={styles.header}>
        <h2 className="text-white text-lg font-bold">{presetDetail.name}</h2>
      </div>
      <Bar
        variantColor="blue"
        variantThickness="thin"
        className={styles.divider}
      />
      <div className={styles.leaders}>
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
