from typing import List

from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO


class AgentDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValDto(BaseModel):
    tier: str
    rank: str
    top_agents: List[AgentDto]


class GetValResponseDTO(BaseResponseDTO[ValDto]):
    pass
