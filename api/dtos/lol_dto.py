from typing import List

from pydantic import BaseModel


class RiotLolChampionStatsDto(BaseModel):
    champion_id: int
    champion_name: str
    champion_icon_url: str
    games_played: int
    wins: int
    losses: int
    win_rate: float


class RiotLolInfoDto(BaseModel):
    game_name: str
    tag_line: str
    summoner_level: int
    profile_icon_id: int
    profile_icon_url: str
    top_champions: List[RiotLolChampionStatsDto]
