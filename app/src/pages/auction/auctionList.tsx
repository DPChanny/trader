import { Loading } from "@/components/loading";
import { AuctionCard } from "./auctionCard";

import styles from "@/styles/pages/auction/auctionList.module.css";

interface AuctionListProps {
  auctions: any[];
  onJoinAsObserver?: (sessionId: string) => void;
  onJoinAsLeader?: (sessionId: string) => void;
  isLoading: boolean;
}

export function AuctionList({
  auctions,
  onJoinAsObserver,
  onJoinAsLeader,
  isLoading,
}: AuctionListProps) {
  if (isLoading) {
    return <Loading />;
  }

  if (!auctions || auctions.length === 0) {
    return <div />;
  }

  return (
    <div className={styles.auctionList}>
      {auctions.map((auction) => (
        <div key={auction.session_id} className={styles.item}>
          <AuctionCard
            presetId={auction.preset_id}
            sessionId={auction.session_id}
            status={auction.status}
            onJoinAsObserver={onJoinAsObserver}
            onJoinAsLeader={onJoinAsLeader}
          />
        </div>
      ))}
    </div>
  );
}
