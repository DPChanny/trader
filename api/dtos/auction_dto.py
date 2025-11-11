from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
from dtos.base_dto import BaseResponseDTO


class AuctionStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MessageType(str, Enum):
    TIMER = "timer"
    PLACE_BID = "place_bid"
    BID_PLACED = "bid_placed"
    USER_SOLD = "user_sold"
    USER_UNSOLD = "user_unsold"
    NEXT_USER = "next_user"
    INIT = "init"
    STATUS = "status"
    ERROR = "error"


class Team(BaseModel):
    team_id: int
    leader_id: int
    member_id_list: List[int] = []
    points: int


class AuctionStateDTO(BaseModel):
    auction_id: str
    status: AuctionStatus
    current_user_id: Optional[int] = None
    current_bid: Optional[int] = None
    current_bidder: Optional[int] = None
    timer: int
    teams: List[Team]
    auction_queue: List[int]
    unsold_queue: List[int]


class AuctionDTO(BaseModel):
    auction_id: str
    preset_id: int


class AddAuctionResponseDTO(BaseResponseDTO[AuctionDTO]):
    pass
