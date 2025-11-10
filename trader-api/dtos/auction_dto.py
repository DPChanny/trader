from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
from dtos.base_dto import BaseResponseDTO


class AuctionStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MessageType(str, Enum):
    AUCTION_STARTED = "auction_started"
    TIMER_TICK = "timer_tick"
    BID_PLACED = "bid_placed"
    USER_SOLD = "user_sold"
    USER_UNSOLD = "user_unsold"
    NEXT_USER = "next_user"
    AUCTION_COMPLETED = "auction_completed"
    SESSION_TERMINATED = "session_terminated"
    ERROR = "error"
    GET_STATE = "get_state"


# Request DTOs
class PlaceBidRequest(BaseModel):
    access_code: str  # leader의 user access_code
    amount: int


# Response DTOs
class Team(BaseModel):
    team_id: int
    leader_id: int
    member_id_list: List[int] = []
    points: int


class AuctionDetailDTO(BaseModel):
    session_id: str
    status: AuctionStatus
    current_user_id: Optional[int] = None
    current_bid: Optional[int] = None
    current_bidder: Optional[int] = None  # team_id
    timer: int
    teams: List[Team]
    auction_queue: List[int]  # user_id 리스트
    unsold_queue: List[int]  # user_id 리스트


class WebSocketMessage(BaseModel):
    type: MessageType
    data: Dict


class BidPlacedData(BaseModel):
    team_id: int
    amount: int


class UserSoldData(BaseModel):
    user_id: int
    team_id: int
    amount: int


class UserUnsoldData(BaseModel):
    user_id: int


# Auction Response DTOs
class AuctionDTO(BaseModel):
    session_id: str
    preset_id: int
    status: str


# Response DTOs
class CreateAuctionResponseDTO(BaseResponseDTO[AuctionDTO]):
    pass


class GetAuctionDetailResponseDTO(BaseResponseDTO[AuctionDetailDTO]):
    pass


class GetAuctionListResponseDTO(BaseResponseDTO[List[AuctionDTO]]):
    pass


class DeleteSessionResponseDTO(BaseResponseDTO[None]):
    pass
