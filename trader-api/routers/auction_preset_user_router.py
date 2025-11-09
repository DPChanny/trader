from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.auction_preset_user_dto import (
    AddAuctionPresetUserRequestDTO,
    UpdateAuctionPresetUserRequestDTO,
    GetAuctionPresetUserDetailResponseDTO,
    GetAuctionPresetUserListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.auction_preset_user_service import (
    add_auction_preset_user_service,
    delete_auction_preset_user_service,
    get_auction_preset_user_list_service,
    get_auction_preset_user_detail_service,
    update_auction_preset_user_service,
)

auction_preset_user_router = APIRouter()


@auction_preset_user_router.post(
    "/", response_model=GetAuctionPresetUserDetailResponseDTO
)
def add_auction_preset_user_route(
    dto: AddAuctionPresetUserRequestDTO, db: Session = Depends(get_db)
):
    return add_auction_preset_user_service(dto, db)


@auction_preset_user_router.get(
    "/", response_model=GetAuctionPresetUserListResponseDTO
)
def get_auction_preset_user_list_route(db: Session = Depends(get_db)):
    return get_auction_preset_user_list_service(db)


@auction_preset_user_router.get(
    "/{preset_user_id}", response_model=GetAuctionPresetUserDetailResponseDTO
)
def get_auction_preset_user_detail_route(
    preset_user_id: int, db: Session = Depends(get_db)
):
    return get_auction_preset_user_detail_service(preset_user_id, db)


@auction_preset_user_router.patch(
    "/{preset_user_id}", response_model=GetAuctionPresetUserDetailResponseDTO
)
def update_auction_preset_user_route(
    preset_user_id: int,
    dto: UpdateAuctionPresetUserRequestDTO,
    db: Session = Depends(get_db),
):
    return update_auction_preset_user_service(preset_user_id, dto, db)


@auction_preset_user_router.delete(
    "/{preset_user_id}", response_model=BaseResponseDTO[None]
)
def delete_auction_preset_user_route(
    preset_user_id: int, db: Session = Depends(get_db)
):
    return delete_auction_preset_user_service(preset_user_id, db)
