from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import UserDTO
from dtos.tier_dto import TierDTO
from dtos.position_dto import PositionDTO


# AuctionPresetUser DTOs
class AuctionPresetUserDTO(BaseModel):
    auction_preset_user_id: int
    auction_preset_id: int
    user_id: int
    tier_id: int

    model_config = {"from_attributes": True}


class AuctionPresetUserDetailDTO(AuctionPresetUserDTO):
    user: Optional[UserDTO] = None
    tier: Optional[TierDTO] = None
    positions: List[PositionDTO] = []


class AddAuctionPresetUserRequestDTO(BaseModel):
    auction_preset_id: int
    user_id: int
    tier_id: int


class UpdateAuctionPresetUserRequestDTO(BaseModel):
    tier_id: Optional[int] = None


class GetAuctionPresetUserDetailResponseDTO(
    BaseResponseDTO[AuctionPresetUserDetailDTO]
):
    pass


class GetAuctionPresetUserListResponseDTO(
    BaseResponseDTO[List[AuctionPresetUserDTO]]
):
    pass
