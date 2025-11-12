import logging

from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import (
    AddPositionRequestDTO,
    UpdatePositionRequestDTO,
    GetPositionDetailResponseDTO,
    GetPositionListResponseDTO,
    PositionDTO,
)
from entities.position import Position
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


def get_position_detail_service(
    position_id: int, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        logger.info(f"Fetching position detail for position_id: {position_id}")
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )

        if not position:
            logger.warning(f"Position not found: {position_id}")
            raise CustomException(404, "Position not found.")

        logger.info(
            f"Successfully retrieved position detail for position_id: {position_id}"
        )
        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="Position detail retrieved successfully.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def add_position_service(
    dto: AddPositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        logger.info(f"Creating new position: {dto.name}")
        position = Position(
            preset_id=dto.preset_id,
            name=dto.name,
            icon_url=dto.icon_url,
        )
        db.add(position)
        db.commit()
        db.refresh(position)

        logger.info(
            f"Position added successfully: {position.name} (ID: {position.position_id})"
        )
        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="Position added successfully.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def get_position_list_service(db: Session) -> GetPositionListResponseDTO | None:
    try:
        logger.info("Fetching position list")
        positions = db.query(Position).all()
        position_dtos = [PositionDTO.model_validate(p) for p in positions]

        logger.info(f"Successfully retrieved {len(position_dtos)} positions")
        return GetPositionListResponseDTO(
            success=True,
            code=200,
            message="Position list retrieved successfully.",
            data=position_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_position_service(
    position_id: int, dto: UpdatePositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        logger.info(f"Updating position: {position_id}")
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )
        if not position:
            logger.warning(f"Position not found for update: {position_id}")
            raise CustomException(404, "Position not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(position, key, value)

        db.commit()
        db.refresh(position)

        logger.info(f"Position updated successfully: {position_id}")
        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="Position updated successfully.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_position_service(
    position_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        logger.info(f"Deleting position: {position_id}")
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )
        if not position:
            logger.warning(f"Position not found for deletion: {position_id}")
            raise CustomException(404, "Position not found")

        db.delete(position)
        db.commit()

        logger.info(f"Position deleted successfully: {position_id}")
        return BaseResponseDTO(
            success=True,
            code=200,
            message="Position deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
