from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.auction_preset_dto import (
    AddAuctionPresetRequestDTO,
    UpdateAuctionPresetRequestDTO,
    GetAuctionPresetDetailResponseDTO,
    GetAuctionPresetListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.auction_preset_service import (
    add_auction_preset_service,
    delete_auction_preset_service,
    get_auction_preset_list_service,
    get_auction_preset_detail_service,
    update_auction_preset_service,
)

auction_preset_router = APIRouter()


@auction_preset_router.post(
    "/", response_model=GetAuctionPresetDetailResponseDTO
)
def add_auction_preset_route(
    dto: AddAuctionPresetRequestDTO, db: Session = Depends(get_db)
):
    return add_auction_preset_service(dto, db)


@auction_preset_router.get("/", response_model=GetAuctionPresetListResponseDTO)
def get_auction_preset_list_route(db: Session = Depends(get_db)):
    return get_auction_preset_list_service(db)


@auction_preset_router.get(
    "/{auction_preset_id}", response_model=GetAuctionPresetDetailResponseDTO
)
def get_auction_preset_detail_route(
    auction_preset_id: int, db: Session = Depends(get_db)
):
    return get_auction_preset_detail_service(auction_preset_id, db)


@auction_preset_router.patch(
    "/{auction_preset_id}", response_model=GetAuctionPresetDetailResponseDTO
)
def update_auction_preset_route(
    auction_preset_id: int,
    dto: UpdateAuctionPresetRequestDTO,
    db: Session = Depends(get_db),
):
    return update_auction_preset_service(auction_preset_id, dto, db)


@auction_preset_router.delete(
    "/{auction_preset_id}", response_model=BaseResponseDTO[None]
)
def delete_auction_preset_route(
    auction_preset_id: int, db: Session = Depends(get_db)
):
    return delete_auction_preset_service(auction_preset_id, db)
