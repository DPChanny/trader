from typing import List, Optional

from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import PositionDTO
from dtos.preset_user_position_dto import PresetUserPositionDetailDTO
from dtos.tier_dto import TierDTO
from dtos.user_dto import UserDTO


class PresetUserDTO(BaseModel):
    preset_user_id: int
    preset_id: int
    user_id: int
    tier_id: Optional[int] = None
    is_leader: bool = False

    model_config = {"from_attributes": True}


class PresetUserDetailDTO(PresetUserDTO):
    user: Optional[UserDTO] = None
    tier: Optional[TierDTO] = None
    positions: List[PresetUserPositionDetailDTO] = []

    @classmethod
    def model_validate(cls, obj, **kwargs):
        positions = []
        if hasattr(obj, "preset_user_positions") and obj.preset_user_positions:
            positions = [
                PresetUserPositionDetailDTO(
                    preset_user_position_id=pup.preset_user_position_id,
                    preset_user_id=pup.preset_user_id,
                    position_id=pup.position_id,
                    position=PositionDTO.model_validate(pup.position),
                )
                for pup in obj.preset_user_positions
            ]

        data = {
            "preset_user_id": obj.preset_user_id,
            "preset_id": obj.preset_id,
            "user_id": obj.user_id,
            "tier_id": obj.tier_id if hasattr(obj, "tier_id") else None,
            "is_leader": obj.is_leader,
            "user": obj.user if hasattr(obj, "user") and obj.user else None,
            "tier": obj.tier if hasattr(obj, "tier") and obj.tier else None,
            "positions": positions,
        }
        return super().model_validate(data, **kwargs)


class AddPresetUserRequestDTO(BaseModel):
    preset_id: int
    user_id: int
    tier_id: Optional[int] = None
    is_leader: bool = False


class UpdatePresetUserRequestDTO(BaseModel):
    tier_id: Optional[int] = None
    is_leader: Optional[bool] = None


class GetPresetUserDetailResponseDTO(BaseResponseDTO[PresetUserDetailDTO]):
    pass


class GetPresetUserListResponseDTO(BaseResponseDTO[List[PresetUserDTO]]):
    pass
