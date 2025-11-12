from pydantic import BaseModel
from typing import List


class RiotLolChampionStatsDto(BaseModel):
    """롤 챔피언 통계 정보"""

    champion_id: int
    champion_name: str
    champion_icon_url: str
    games_played: int
    wins: int
    losses: int
    win_rate: float


class RiotLolInfoDto(BaseModel):
    """리그오브레전드 소환사 정보"""

    game_name: str
    tag_line: str
    summoner_level: int
    profile_icon_id: int
    profile_icon_url: str
    top_champions: List[RiotLolChampionStatsDto]
