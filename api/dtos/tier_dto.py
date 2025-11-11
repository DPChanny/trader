from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO


class TierDTO(BaseModel):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierRequestDTO(BaseModel):
    preset_id: int
    name: str


class UpdateTierRequestDTO(BaseModel):
    name: Optional[str] = None


class GetTierDetailResponseDTO(BaseResponseDTO[TierDTO]):
    pass


class GetTierListResponseDTO(BaseResponseDTO[List[TierDTO]]):
    pass
