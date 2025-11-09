from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class AuctionStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MessageType(str, Enum):
    SESSION_CREATED = "session_created"
    AUCTION_STARTED = "auction_started"
    TIMER_STARTED = "timer_started"
    TIMER_TICK = "timer_tick"
    BID_PLACED = "bid_placed"
    BID_ACCEPTED = "bid_accepted"
    BID_FAILED = "bid_failed"
    USER_SOLD = "user_sold"
    USER_UNSOLD = "user_unsold"
    NEXT_USER = "next_user"
    AUCTION_COMPLETED = "auction_completed"
    ERROR = "error"
    GET_STATE = "get_state"


# Request DTOs
class StartAuctionRequest(BaseModel):
    preset_id: int


class PlaceBidRequest(BaseModel):
    session_id: str
    team_id: int  # preset_leader_id
    amount: int


# Response DTOs
class Team(BaseModel):
    team_id: int
    leader_id: int
    member_id_list: List[int] = []
    points: int


class AuctionState(BaseModel):
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


class SessionCreatedData(BaseModel):
    session_id: str


class BidPlacedData(BaseModel):
    team_id: int
    amount: int
    time_remaining: int


class UserSoldData(BaseModel):
    user_id: int
    team_id: int
    amount: int


class UserUnsoldData(BaseModel):
    user_id: int
