from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.auction_preset_tier_dto import (
    AddAuctionPresetTierRequestDTO,
    UpdateAuctionPresetTierRequestDTO,
    GetAuctionPresetTierDetailResponseDTO,
    GetAuctionPresetTierListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.auction_preset_tier_service import (
    add_auction_preset_tier_service,
    delete_auction_preset_tier_service,
    get_auction_preset_tier_list_service,
    get_auction_preset_tier_detail_service,
    update_auction_preset_tier_service,
)

auction_preset_tier_router = APIRouter()


@auction_preset_tier_router.post(
    "/", response_model=GetAuctionPresetTierDetailResponseDTO
)
def add_auction_preset_tier_route(
    dto: AddAuctionPresetTierRequestDTO, db: Session = Depends(get_db)
):
    return add_auction_preset_tier_service(dto, db)


@auction_preset_tier_router.get(
    "/", response_model=GetAuctionPresetTierListResponseDTO
)
def get_auction_preset_tier_list_route(db: Session = Depends(get_db)):
    return get_auction_preset_tier_list_service(db)


@auction_preset_tier_router.get(
    "/{tier_id}", response_model=GetAuctionPresetTierDetailResponseDTO
)
def get_auction_preset_tier_detail_route(
    tier_id: int, db: Session = Depends(get_db)
):
    return get_auction_preset_tier_detail_service(tier_id, db)


@auction_preset_tier_router.patch(
    "/{tier_id}", response_model=GetAuctionPresetTierDetailResponseDTO
)
def update_auction_preset_tier_route(
    tier_id: int,
    dto: UpdateAuctionPresetTierRequestDTO,
    db: Session = Depends(get_db),
):
    return update_auction_preset_tier_service(tier_id, dto, db)


@auction_preset_tier_router.delete(
    "/{tier_id}", response_model=BaseResponseDTO[None]
)
def delete_auction_preset_tier_route(
    tier_id: int, db: Session = Depends(get_db)
):
    return delete_auction_preset_tier_service(tier_id, db)
