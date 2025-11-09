from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO


# Position DTOs
class PositionDTO(BaseModel):
    position_id: int
    preset_user_id: int
    name: str

    model_config = {"from_attributes": True}


class AddPositionRequestDTO(BaseModel):
    preset_user_id: int
    name: str


class UpdatePositionRequestDTO(BaseModel):
    name: Optional[str] = None


class GetPositionDetailResponseDTO(BaseResponseDTO[PositionDTO]):
    pass


class GetPositionListResponseDTO(BaseResponseDTO[List[PositionDTO]]):
    pass
