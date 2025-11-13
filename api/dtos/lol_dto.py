from typing import List

from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO


class ChampionDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class LolDto(BaseModel):
    tier: str
    rank: str
    lp: int
    top_champions: List[ChampionDto]


class GetLolResponseDTO(BaseResponseDTO[LolDto]):
    pass
