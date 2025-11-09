from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.tier_dto import TierDTO
from dtos.auction_preset_user_dto import AuctionPresetUserDTO


# AuctionPreset DTOs
class AuctionPresetDTO(BaseModel):
    auction_preset_id: int
    name: str
    user_id: int

    model_config = {"from_attributes": True}


class AuctionPresetDetailDTO(AuctionPresetDTO):
    tiers: List[TierDTO] = []
    auction_preset_users: List[AuctionPresetUserDTO] = []


class AddAuctionPresetRequestDTO(BaseModel):
    name: str
    user_id: int


class UpdateAuctionPresetRequestDTO(BaseModel):
    name: Optional[str] = None
    user_id: Optional[int] = None


class GetAuctionPresetDetailResponseDTO(
    BaseResponseDTO[AuctionPresetDetailDTO]
):
    pass


class GetAuctionPresetListResponseDTO(BaseResponseDTO[List[AuctionPresetDTO]]):
    pass
