from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import PositionDTO


class PresetUserPositionDTO(BaseModel):
    preset_user_position_id: int
    preset_user_id: int
    position_id: int

    model_config = {"from_attributes": True}


class PresetUserPositionDetailDTO(PresetUserPositionDTO):
    position: PositionDTO


class AddPresetUserPositionRequestDTO(BaseModel):
    preset_user_id: int
    position_id: int


class DeletePresetUserPositionRequestDTO(BaseModel):
    preset_user_position_id: int


class GetPresetUserPositionResponseDTO(BaseResponseDTO[PresetUserPositionDTO]):
    pass
