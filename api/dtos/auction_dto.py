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
    BID_REQUEST = "bid_request"
    BID_RESPONSE = "bid_response"
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


class WebSocketMessage(BaseModel):
    type: MessageType
    data: Dict


class BidRequestData(BaseModel):
    amount: int


class BidResponseData(BaseModel):
    team_id: int
    amount: int


class UserSoldData(BaseModel):
    user_id: int
    team_id: int
    amount: int


class UserUnsoldData(BaseModel):
    user_id: int


class AuctionInitDTO(BaseModel):
    auction_id: str
    status: AuctionStatus
    current_user_id: Optional[int] = None
    current_bid: Optional[int] = None
    current_bidder: Optional[int] = None
    timer: int
    teams: List[Team]
    auction_queue: List[int]
    unsold_queue: List[int]
    role: str  # "leader" or "observer"
    user_id: int
    team_id: Optional[int] = None


class AuctionDTO(BaseModel):
    auction_id: str
    preset_id: int
    status: str


class CreateAuctionResponseDTO(BaseResponseDTO[AuctionDTO]):
    pass
