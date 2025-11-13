from typing import List

from pydantic import BaseModel


class AgentDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValDto(BaseModel):
    tier: str
    rank: str
    rr: int
    win_rate: float
    top_agents: List[AgentDto]
