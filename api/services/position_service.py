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
        logger.info(f"Position get: {position_id}")
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )

        if not position:
            logger.warning(f"Position missing: {position_id}")
            raise CustomException(404, "Position not found.")

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
        logger.info(f"Position add: {dto.name}")
        position = Position(
            preset_id=dto.preset_id,
            name=dto.name,
            icon_url=dto.icon_url,
        )
        db.add(position)
        db.commit()
        db.refresh(position)

        logger.info(f"Position: {position.position_id}")
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
        logger.info("Position list")
        positions = db.query(Position).all()
        position_dtos = [PositionDTO.model_validate(p) for p in positions]

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
        logger.info(f"Position update: {position_id}")
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )
        if not position:
            logger.warning(f"Position missing: {position_id}")
            raise CustomException(404, "Position not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(position, key, value)

        db.commit()
        db.refresh(position)

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
        logger.info(f"Position delete: {position_id}")
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )
        if not position:
            logger.warning(f"Position missing: {position_id}")
            raise CustomException(404, "Position not found")

        db.delete(position)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Position deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
