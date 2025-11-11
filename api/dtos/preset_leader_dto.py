from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import UserDTO


class PresetLeaderDTO(BaseModel):
    preset_leader_id: int
    preset_id: int
    user_id: int

    model_config = {"from_attributes": True}


class PresetLeaderDetailDTO(PresetLeaderDTO):
    user: Optional[UserDTO] = None


class AddPresetLeaderRequestDTO(BaseModel):
    preset_id: int
    user_id: int


class UpdatePresetLeaderRequestDTO(BaseModel):
    user_id: Optional[int] = None


class GetPresetLeaderDetailResponseDTO(BaseResponseDTO[PresetLeaderDetailDTO]):
    pass


class GetPresetLeaderListResponseDTO(BaseResponseDTO[List[PresetLeaderDTO]]):
    pass
