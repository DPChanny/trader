from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import UserDTO
from dtos.tier_dto import TierDTO
from dtos.position_dto import PositionDTO


# PresetUser DTOs
class PresetUserDTO(BaseModel):
    preset_user_id: int
    preset_id: int
    user_id: int
    tier_id: Optional[int] = None

    model_config = {"from_attributes": True}


class PresetUserDetailDTO(PresetUserDTO):
    user: Optional[UserDTO] = None
    tier: Optional[TierDTO] = None
    positions: List[PositionDTO] = []


class AddPresetUserRequestDTO(BaseModel):
    preset_id: int
    user_id: int
    tier_id: Optional[int] = None


class UpdatePresetUserRequestDTO(BaseModel):
    tier_id: Optional[int] = None


class GetPresetUserDetailResponseDTO(BaseResponseDTO[PresetUserDetailDTO]):
    pass


class GetPresetUserListResponseDTO(BaseResponseDTO[List[PresetUserDTO]]):
    pass
