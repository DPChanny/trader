from typing import List, Optional
from enum import Enum

from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import PositionDTO
from dtos.preset_user_dto import PresetUserDetailDTO
from dtos.tier_dto import TierDTO


class Statistics(str, Enum):
    NONE = "NONE"
    LOL = "LOL"
    VAL = "VAL"


class PresetDTO(BaseModel):
    preset_id: int
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    preset_users: List[PresetUserDetailDTO] = []
    tiers: List[TierDTO] = []
    positions: List[PositionDTO] = []

    @classmethod
    def model_validate(cls, obj, **kwargs):
        preset_users = []
        if hasattr(obj, "preset_users") and obj.preset_users:
            preset_users = [
                PresetUserDetailDTO.model_validate(pu)
                for pu in obj.preset_users
            ]

        data = {
            "preset_id": obj.preset_id,
            "name": obj.name,
            "points": obj.points,
            "time": obj.time,
            "point_scale": obj.point_scale,
            "statistics": obj.statistics,
            "preset_users": preset_users,
            "tiers": obj.tiers if hasattr(obj, "tiers") and obj.tiers else [],
            "positions": (
                obj.positions
                if hasattr(obj, "positions") and obj.positions
                else []
            ),
        }
        return super().model_validate(data, **kwargs)


class AddPresetRequestDTO(BaseModel):
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics = Statistics.NONE


class UpdatePresetRequestDTO(BaseModel):
    name: Optional[str] = None
    points: Optional[int] = None
    time: Optional[int] = None
    point_scale: Optional[int] = None
    statistics: Optional[Statistics] = None


class GetPresetDetailResponseDTO(BaseResponseDTO[PresetDetailDTO]):
    pass


class GetPresetListResponseDTO(BaseResponseDTO[List[PresetDTO]]):
    pass
