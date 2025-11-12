from sqlalchemy.orm import Session
from entities.preset_user_position import PresetUserPosition
from dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
    PresetUserPositionDTO,
)
from dtos.base_dto import BaseResponseDTO
from utils.exception import CustomException, handle_exception
import logging

logger = logging.getLogger(__name__)


def add_preset_user_position_service(
    dto: AddPresetUserPositionRequestDTO, db: Session
) -> GetPresetUserPositionResponseDTO:
    try:
        logger.info(
            f"Adding position {dto.position_id} to preset_user {dto.preset_user_id}"
        )

        # Check if already exists
        existing = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_id == dto.preset_user_id,
                PresetUserPosition.position_id == dto.position_id,
            )
            .first()
        )

        if existing:
            logger.warning("Position already assigned to this preset_user")
            raise CustomException(
                400, "This position is already assigned to the preset_user."
            )

        preset_user_position = PresetUserPosition(
            preset_user_id=dto.preset_user_id,
            position_id=dto.position_id,
        )
        db.add(preset_user_position)
        db.commit()
        db.refresh(preset_user_position)

        logger.info(
            f"PresetUserPosition added successfully: ID {preset_user_position.preset_user_position_id}"
        )
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
) -> BaseResponseDTO:
    try:
        logger.info(
            f"Deleting preset_user_position: {dto.preset_user_position_id}"
        )
        preset_user_position = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_position_id
                == dto.preset_user_position_id
            )
            .first()
        )

        if not preset_user_position:
            logger.warning(
                f"PresetUserPosition not found: {dto.preset_user_position_id}"
            )
            raise CustomException(404, "PresetUserPosition not found.")

        db.delete(preset_user_position)
        db.commit()

        logger.info(
            f"PresetUserPosition deleted successfully: {dto.preset_user_position_id}"
        )
        return BaseResponseDTO(
            success=True,
            code=200,
            message="Position removed from preset_user successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
