from sqlalchemy.orm import Session
from entities.auction_preset_tier import AuctionPresetTier
from dtos.auction_preset_tier_dto import (
    AddAuctionPresetTierRequestDTO,
    UpdateAuctionPresetTierRequestDTO,
    GetAuctionPresetTierDetailResponseDTO,
    GetAuctionPresetTierListResponseDTO,
    AuctionPresetTierDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_auction_preset_tier_detail_service(
    tier_id: int, db: Session
) -> GetAuctionPresetTierDetailResponseDTO:
    try:
        tier = (
            db.query(AuctionPresetTier)
            .filter(AuctionPresetTier.auction_preset_tier_id == tier_id)
            .first()
        )

        if not tier:
            raise CustomException(404, "Auction preset tier not found.")

        return GetAuctionPresetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Auction preset tier detail retrieved successfully.",
            data=AuctionPresetTierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def add_auction_preset_tier_service(
    dto: AddAuctionPresetTierRequestDTO, db: Session
) -> GetAuctionPresetTierDetailResponseDTO:
    try:
        tier = AuctionPresetTier(
            auction_preset_id=dto.auction_preset_id, name=dto.name
        )
        db.add(tier)
        db.commit()

        return get_auction_preset_tier_detail_service(
            tier.auction_preset_tier_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def get_auction_preset_tier_list_service(
    db: Session,
) -> GetAuctionPresetTierListResponseDTO:
    try:
        tiers = db.query(AuctionPresetTier).all()
        tier_dtos = [AuctionPresetTierDTO.model_validate(t) for t in tiers]

        return GetAuctionPresetTierListResponseDTO(
            success=True,
            code=200,
            message="Auction preset tier list retrieved successfully.",
            data=tier_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_auction_preset_tier_service(
    tier_id: int, dto: UpdateAuctionPresetTierRequestDTO, db: Session
) -> GetAuctionPresetTierDetailResponseDTO:
    try:
        tier = (
            db.query(AuctionPresetTier)
            .filter(AuctionPresetTier.auction_preset_tier_id == tier_id)
            .first()
        )
        if not tier:
            raise CustomException(404, "Auction preset tier not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(tier, key, value)

        db.commit()

        return get_auction_preset_tier_detail_service(
            tier.auction_preset_tier_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def delete_auction_preset_tier_service(
    tier_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        tier = (
            db.query(AuctionPresetTier)
            .filter(AuctionPresetTier.auction_preset_tier_id == tier_id)
            .first()
        )
        if not tier:
            raise CustomException(404, "Auction preset tier not found")

        db.delete(tier)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Auction preset tier deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
