from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import UserDTO
from dtos.auction_preset_tier_dto import AuctionPresetTierDTO


# AuctionPresetUser DTOs
class AuctionPresetUserDTO(BaseModel):
    auction_preset_user_id: int
    auction_preset_id: int
    user_id: int
    auction_preset_tier_id: int

    model_config = {"from_attributes": True}


class AuctionPresetUserDetailDTO(AuctionPresetUserDTO):
    user: Optional[UserDTO] = None
    tier: Optional[AuctionPresetTierDTO] = None


class AddAuctionPresetUserRequestDTO(BaseModel):
    auction_preset_id: int
    user_id: int
    auction_preset_tier_id: int


class UpdateAuctionPresetUserRequestDTO(BaseModel):
    auction_preset_tier_id: Optional[int] = None


class GetAuctionPresetUserDetailResponseDTO(
    BaseResponseDTO[AuctionPresetUserDetailDTO]
):
    pass


class GetAuctionPresetUserListResponseDTO(
    BaseResponseDTO[List[AuctionPresetUserDTO]]
):
    pass
