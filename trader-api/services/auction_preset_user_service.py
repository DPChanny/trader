from sqlalchemy.orm import Session, joinedload
from entities.auction_preset_user import AuctionPresetUser
from dtos.auction_preset_user_dto import (
    AddAuctionPresetUserRequestDTO,
    UpdateAuctionPresetUserRequestDTO,
    GetAuctionPresetUserDetailResponseDTO,
    GetAuctionPresetUserListResponseDTO,
    AuctionPresetUserDTO,
    AuctionPresetUserDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_auction_preset_user_detail_service(
    preset_user_id: int, db: Session
) -> GetAuctionPresetUserDetailResponseDTO:
    try:
        preset_user = (
            db.query(AuctionPresetUser)
            .options(
                joinedload(AuctionPresetUser.user),
                joinedload(AuctionPresetUser.tier),
                joinedload(AuctionPresetUser.positions),
            )
            .filter(AuctionPresetUser.auction_preset_user_id == preset_user_id)
            .first()
        )

        if not preset_user:
            raise CustomException(404, "Auction preset user not found.")

        return GetAuctionPresetUserDetailResponseDTO(
            success=True,
            code=200,
            message="Auction preset user detail retrieved successfully.",
            data=AuctionPresetUserDetailDTO.model_validate(preset_user),
        )

    except Exception as e:
        handle_exception(e, db)


def add_auction_preset_user_service(
    dto: AddAuctionPresetUserRequestDTO, db: Session
) -> GetAuctionPresetUserDetailResponseDTO:
    try:
        preset_user = AuctionPresetUser(
            auction_preset_id=dto.auction_preset_id,
            user_id=dto.user_id,
            tier_id=dto.tier_id,
        )
        db.add(preset_user)
        db.commit()

        return get_auction_preset_user_detail_service(
            preset_user.auction_preset_user_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def get_auction_preset_user_list_service(
    db: Session,
) -> GetAuctionPresetUserListResponseDTO:
    try:
        preset_users = db.query(AuctionPresetUser).all()
        preset_user_dtos = [
            AuctionPresetUserDTO.model_validate(pu) for pu in preset_users
        ]

        return GetAuctionPresetUserListResponseDTO(
            success=True,
            code=200,
            message="Auction preset user list retrieved successfully.",
            data=preset_user_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_auction_preset_user_service(
    preset_user_id: int, dto: UpdateAuctionPresetUserRequestDTO, db: Session
) -> GetAuctionPresetUserDetailResponseDTO:
    try:
        preset_user = (
            db.query(AuctionPresetUser)
            .filter(AuctionPresetUser.auction_preset_user_id == preset_user_id)
            .first()
        )
        if not preset_user:
            raise CustomException(404, "Auction preset user not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset_user, key, value)

        db.commit()

        return get_auction_preset_user_detail_service(
            preset_user.auction_preset_user_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def delete_auction_preset_user_service(
    preset_user_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        preset_user = (
            db.query(AuctionPresetUser)
            .filter(AuctionPresetUser.auction_preset_user_id == preset_user_id)
            .first()
        )
        if not preset_user:
            raise CustomException(404, "Auction preset user not found")

        db.delete(preset_user)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Auction preset user deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
