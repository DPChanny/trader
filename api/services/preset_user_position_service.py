import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
    PresetUserPositionDTO,
)
from entities.preset_user_position import PresetUserPosition
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


def add_preset_user_position_service(
    dto: AddPresetUserPositionRequestDTO, db: Session
) -> GetPresetUserPositionResponseDTO | None:
    try:
        logger.info(f"Position add: {dto.position_id} -> {dto.preset_user_id}")

        existing = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_id == dto.preset_user_id,
                PresetUserPosition.position_id == dto.position_id,
            )
            .first()
        )

        if existing:
            logger.warning("Position duplicate")
            raise CustomException(
                400, "This position is already assigned to the preset_user."
            )

        preset_user_position = PresetUserPosition(
            preset_user_id=dto.preset_user_id,
            position_id=dto.position_id,
        )
        db.add(preset_user_position)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise CustomException(
                400, "This position is already assigned to the preset_user."
            )
        db.refresh(preset_user_position)

        logger.info(f"Position: {preset_user_position.preset_user_position_id}")
        return GetPresetUserPositionResponseDTO(
            success=True,
            code=200,
            message="Position assigned to preset_user successfully.",
            data=PresetUserPositionDTO.model_validate(preset_user_position),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_user_position_service(
    dto: DeletePresetUserPositionRequestDTO, db: Session
) -> BaseResponseDTO | None:
    try:
        logger.info(f"Position delete: {dto.preset_user_position_id}")
        preset_user_position = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_position_id
                == dto.preset_user_position_id
            )
            .first()
        )

        if not preset_user_position:
            logger.warning(f"Position missing: {dto.preset_user_position_id}")
            raise CustomException(404, "PresetUserPosition not found.")

        db.delete(preset_user_position)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Position removed from preset_user successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
