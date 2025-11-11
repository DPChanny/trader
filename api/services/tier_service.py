from sqlalchemy.orm import Session
from entities.tier import Tier
from dtos.tier_dto import (
    AddTierRequestDTO,
    UpdateTierRequestDTO,
    GetTierDetailResponseDTO,
    GetTierListResponseDTO,
    TierDTO,
)
from dtos.base_dto import BaseResponseDTO
from utils.exception import CustomException, handle_exception
import logging

logger = logging.getLogger(__name__)


def get_tier_detail_service(
    tier_id: int, db: Session
) -> GetTierDetailResponseDTO:
    try:
        logger.info(f"Fetching tier detail for tier_id: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()

        if not tier:
            logger.warning(f"Tier not found: {tier_id}")
            raise CustomException(404, "Tier not found.")

        logger.info(
            f"Successfully retrieved tier detail for tier_id: {tier_id}"
        )
        return GetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Tier detail retrieved successfully.",
            data=TierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def add_tier_service(
    dto: AddTierRequestDTO, db: Session
) -> GetTierDetailResponseDTO:
    try:
        logger.info(f"Creating new tier: {dto.name}")
        tier = Tier(preset_id=dto.preset_id, name=dto.name)
        db.add(tier)
        db.commit()
        db.refresh(tier)

        logger.info(
            f"Tier added successfully: {tier.name} (ID: {tier.tier_id})"
        )
        return GetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Tier added successfully.",
            data=TierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def get_tier_list_service(
    db: Session,
) -> GetTierListResponseDTO:
    try:
        logger.info("Fetching tier list")
        tiers = db.query(Tier).all()
        tier_dtos = [TierDTO.model_validate(t) for t in tiers]

        logger.info(f"Successfully retrieved {len(tier_dtos)} tiers")
        return GetTierListResponseDTO(
            success=True,
            code=200,
            message="Tier list retrieved successfully.",
            data=tier_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_tier_service(
    tier_id: int, dto: UpdateTierRequestDTO, db: Session
) -> GetTierDetailResponseDTO:
    try:
        logger.info(f"Updating tier: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
            logger.warning(f"Tier not found for update: {tier_id}")
            raise CustomException(404, "Tier not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(tier, key, value)

        db.commit()
        db.refresh(tier)

        logger.info(f"Tier updated successfully: {tier_id}")
        return GetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Tier updated successfully.",
            data=TierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_tier_service(tier_id: int, db: Session) -> BaseResponseDTO[None]:
    try:
        logger.info(f"Deleting tier: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
            logger.warning(f"Tier not found for deletion: {tier_id}")
            raise CustomException(404, "Tier not found")

        db.delete(tier)
        db.commit()

        logger.info(f"Tier deleted successfully: {tier_id}")
        return BaseResponseDTO(
            success=True,
            code=200,
            message="Tier deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
