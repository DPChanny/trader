from sqlalchemy.orm import Session, joinedload
from entities.auction_preset import AuctionPreset
from dtos.auction_preset_dto import (
    AddAuctionPresetRequestDTO,
    UpdateAuctionPresetRequestDTO,
    GetAuctionPresetDetailResponseDTO,
    GetAuctionPresetListResponseDTO,
    AuctionPresetDTO,
    AuctionPresetDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_auction_preset_detail_service(
    auction_preset_id: int, db: Session
) -> GetAuctionPresetDetailResponseDTO:
    try:
        preset = (
            db.query(AuctionPreset)
            .options(
                joinedload(AuctionPreset.tiers),
                joinedload(AuctionPreset.auction_preset_users),
            )
            .filter(AuctionPreset.auction_preset_id == auction_preset_id)
            .first()
        )

        if not preset:
            raise CustomException(404, "Auction preset not found.")

        return GetAuctionPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Auction preset detail retrieved successfully.",
            data=AuctionPresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def add_auction_preset_service(
    dto: AddAuctionPresetRequestDTO, db: Session
) -> GetAuctionPresetDetailResponseDTO:
    try:
        preset = AuctionPreset(name=dto.name, user_id=dto.user_id)
        db.add(preset)
        db.commit()

        return get_auction_preset_detail_service(preset.auction_preset_id, db)

    except Exception as e:
        handle_exception(e, db)


def get_auction_preset_list_service(
    db: Session,
) -> GetAuctionPresetListResponseDTO:
    try:
        presets = db.query(AuctionPreset).all()
        preset_dtos = [AuctionPresetDTO.model_validate(p) for p in presets]

        return GetAuctionPresetListResponseDTO(
            success=True,
            code=200,
            message="Auction preset list retrieved successfully.",
            data=preset_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_auction_preset_service(
    auction_preset_id: int, dto: UpdateAuctionPresetRequestDTO, db: Session
) -> GetAuctionPresetDetailResponseDTO:
    try:
        preset = (
            db.query(AuctionPreset)
            .filter(AuctionPreset.auction_preset_id == auction_preset_id)
            .first()
        )
        if not preset:
            raise CustomException(404, "Auction preset not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset, key, value)

        db.commit()

        return get_auction_preset_detail_service(preset.auction_preset_id, db)

    except Exception as e:
        handle_exception(e, db)


def delete_auction_preset_service(
    auction_preset_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        preset = (
            db.query(AuctionPreset)
            .filter(AuctionPreset.auction_preset_id == auction_preset_id)
            .first()
        )
        if not preset:
            raise CustomException(404, "Auction preset not found")

        db.delete(preset)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Auction preset deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
