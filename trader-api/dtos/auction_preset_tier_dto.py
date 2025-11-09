from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO


# AuctionPresetTier DTOs
class AuctionPresetTierDTO(BaseModel):
    auction_preset_tier_id: int
    auction_preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddAuctionPresetTierRequestDTO(BaseModel):
    auction_preset_id: int
    name: str


class UpdateAuctionPresetTierRequestDTO(BaseModel):
    name: Optional[str] = None


class GetAuctionPresetTierDetailResponseDTO(
    BaseResponseDTO[AuctionPresetTierDTO]
):
    pass


class GetAuctionPresetTierListResponseDTO(
    BaseResponseDTO[List[AuctionPresetTierDTO]]
):
    pass
