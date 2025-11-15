import logging

from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.tier_dto import (
    AddTierRequestDTO,
    UpdateTierRequestDTO,
    GetTierDetailResponseDTO,
    GetTierListResponseDTO,
    TierDTO,
)
from entities.tier import Tier
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


def get_tier_detail_service(
    tier_id: int, db: Session
) -> GetTierDetailResponseDTO | None:
    try:
        logger.info(f"Get: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()

        if not tier:
            logger.warning(f"Tier missing: {tier_id}")
            raise CustomException(404, "Tier not found.")

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
) -> GetTierDetailResponseDTO | None:
    try:
        logger.info(f"Add: {dto.name}")
        tier = Tier(preset_id=dto.preset_id, name=dto.name)
        db.add(tier)
        db.commit()
        db.refresh(tier)

        logger.info(f"Added: {tier.tier_id}")
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
) -> GetTierListResponseDTO | None:
    try:
        logger.info("List")
        tiers = db.query(Tier).all()
        tier_dtos = [TierDTO.model_validate(t) for t in tiers]

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
) -> GetTierDetailResponseDTO | None:
    try:
        logger.info(f"Update: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
            logger.warning(f"Tier missing: {tier_id}")
            raise CustomException(404, "Tier not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(tier, key, value)

        db.commit()
        db.refresh(tier)

        return GetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Tier updated successfully.",
            data=TierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_tier_service(
    tier_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        logger.info(f"Delete: {tier_id}")
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
            logger.warning(f"Tier missing: {tier_id}")
            raise CustomException(404, "Tier not found")

        db.delete(tier)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Tier deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
