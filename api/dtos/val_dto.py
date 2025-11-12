from typing import List

from pydantic import BaseModel


class RiotValAgentStatsDto(BaseModel):
    agent_id: str
    agent_name: str
    agent_icon_url: str
    games_played: int
    wins: int
    losses: int
    win_rate: float


class RiotValInfoDto(BaseModel):
    game_name: str
    tag_line: str
    account_level: int
    card_id: str
    card_url: str
    top_agents: List[RiotValAgentStatsDto]
