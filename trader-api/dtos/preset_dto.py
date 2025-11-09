from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.tier_dto import TierDTO
from dtos.preset_user_dto import PresetUserDTO


# Preset DTOs
class PresetDTO(BaseModel):
    preset_id: int
    name: str
    user_id: int

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    tiers: List[TierDTO] = []
    preset_users: List[PresetUserDTO] = []


class AddPresetRequestDTO(BaseModel):
    name: str
    user_id: int


class UpdatePresetRequestDTO(BaseModel):
    name: Optional[str] = None
    user_id: Optional[int] = None


class GetPresetDetailResponseDTO(BaseResponseDTO[PresetDetailDTO]):
    pass


class GetPresetListResponseDTO(BaseResponseDTO[List[PresetDTO]]):
    pass
