from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.tier_dto import TierDTO
from dtos.position_dto import PositionDTO
from dtos.preset_user_dto import PresetUserDetailDTO


class PresetDTO(BaseModel):
    preset_id: int
    name: str
    points: int
    time: int
    point_scale: int

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


class UpdatePresetRequestDTO(BaseModel):
    name: Optional[str] = None
    points: Optional[int] = None
    time: Optional[int] = None
    point_scale: Optional[int] = None


class GetPresetDetailResponseDTO(BaseResponseDTO[PresetDetailDTO]):
    pass


class GetPresetListResponseDTO(BaseResponseDTO[List[PresetDTO]]):
    pass
