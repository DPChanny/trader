import { Loading } from "@/components/loading";
import { AuctionCard } from "./auctionCard";
import "@/styles/pages/auction/auctionList.css";

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
    return (
      <div className="auction-list-empty">
        <p>진행 중인 경매가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="auction-list">
      {auctions.map((auction) => {
        return (
          <div key={auction.session_id} className="auction-list-item">
            <AuctionCard
              presetId={auction.preset_id}
              sessionId={auction.session_id}
              status={auction.status}
              onJoinAsObserver={onJoinAsObserver}
              onJoinAsLeader={onJoinAsLeader}
            />
          </div>
        );
      })}
    </div>
  );
}
