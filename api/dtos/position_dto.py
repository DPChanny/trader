from typing import List, Optional

from pydantic import BaseModel

from dtos.base_dto import BaseResponseDTO


class PositionDTO(BaseModel):
    position_id: int
    preset_id: int
    name: str
    icon_url: Optional[str] = None

    model_config = {"from_attributes": True}


class AddPositionRequestDTO(BaseModel):
    preset_id: int
    name: str
    icon_url: Optional[str] = None


class UpdatePositionRequestDTO(BaseModel):
    name: Optional[str] = None
    icon_url: Optional[str] = None


class GetPositionDetailResponseDTO(BaseResponseDTO[PositionDTO]):
    pass


class GetPositionListResponseDTO(BaseResponseDTO[List[PositionDTO]]):
    pass
