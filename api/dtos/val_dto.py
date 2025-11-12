from pydantic import BaseModel
from typing import List


class RiotValAgentStatsDto(BaseModel):
    """발로란트 에이전트 통계 정보"""

    agent_id: str
    agent_name: str
    agent_icon_url: str
    games_played: int
    wins: int
    losses: int
    win_rate: float


class RiotValInfoDto(BaseModel):
    """발로란트 계정 정보"""

    game_name: str
    tag_line: str
    account_level: int
    card_id: str
    card_url: str
    top_agents: List[RiotValAgentStatsDto]
