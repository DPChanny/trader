from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.tier_dto import TierDTO
from dtos.preset_user_dto import PresetUserDetailDTO
from dtos.preset_leader_dto import PresetLeaderDetailDTO
from dtos.user_dto import UserDTO


class PresetDTO(BaseModel):
    preset_id: int
    name: str
    points: int = 1000
    time: int = 30

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    leaders: List[PresetLeaderDetailDTO] = []
    preset_users: List[PresetUserDetailDTO] = []
    tiers: List[TierDTO] = []

    @classmethod
    def model_validate(cls, obj, **kwargs):

        data = {
            "preset_id": obj.preset_id,
            "name": obj.name,
            "points": obj.points,
            "time": obj.time,
            "leaders": (
                obj.preset_leaders if hasattr(obj, "preset_leaders") else []
            ),
            "preset_users": (
                obj.preset_users if hasattr(obj, "preset_users") else []
            ),
            "tiers": obj.tiers if hasattr(obj, "tiers") else [],
        }
        return super().model_validate(data, **kwargs)


class AddPresetRequestDTO(BaseModel):
    name: str
    points: int = 1000
    time: int = 30


class UpdatePresetRequestDTO(BaseModel):
    name: Optional[str] = None
    points: Optional[int] = None
    time: Optional[int] = None


class GetPresetDetailResponseDTO(BaseResponseDTO[PresetDetailDTO]):
    pass


class GetPresetListResponseDTO(BaseResponseDTO[List[PresetDTO]]):
    pass
