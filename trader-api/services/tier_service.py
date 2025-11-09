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
from exception import CustomException, handle_exception


def get_tier_detail_service(
    tier_id: int, db: Session
) -> GetTierDetailResponseDTO:
    try:
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()

        if not tier:
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
) -> GetTierDetailResponseDTO:
    try:
        tier = Tier(preset_id=dto.preset_id, name=dto.name)
        db.add(tier)
        db.commit()
        db.refresh(tier)

        return GetTierDetailResponseDTO(
            success=True,
            code=200,
            message="Tier created successfully.",
            data=TierDTO.model_validate(tier),
        )

    except Exception as e:
        handle_exception(e, db)


def get_tier_list_service(
    db: Session,
) -> GetTierListResponseDTO:
    try:
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
) -> GetTierDetailResponseDTO:
    try:
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
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


def delete_tier_service(tier_id: int, db: Session) -> BaseResponseDTO[None]:
    try:
        tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
        if not tier:
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
