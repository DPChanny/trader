from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.auction_preset_tier_dto import AuctionPresetTierDTO
from dtos.auction_preset_user_dto import AuctionPresetUserDTO


# AuctionPreset DTOs
class AuctionPresetDTO(BaseModel):
    auction_preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AuctionPresetDetailDTO(AuctionPresetDTO):
    tiers: List[AuctionPresetTierDTO] = []
    auction_preset_users: List[AuctionPresetUserDTO] = []


class AddAuctionPresetRequestDTO(BaseModel):
    name: str


class UpdateAuctionPresetRequestDTO(BaseModel):
    name: Optional[str] = None


class GetAuctionPresetDetailResponseDTO(
    BaseResponseDTO[AuctionPresetDetailDTO]
):
    pass


class GetAuctionPresetListResponseDTO(BaseResponseDTO[List[AuctionPresetDTO]]):
    pass
