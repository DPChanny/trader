from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging

from dtos.base_dto import BaseResponseDTO
from dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
)
from services.preset_user_position_service import (
    add_preset_user_position_service,
    delete_preset_user_position_service,
)
from utils.database import get_db

logger = logging.getLogger(__name__)

preset_user_position_router = APIRouter(
    prefix="/preset_user_position", tags=["preset_user_position"]
)


@preset_user_position_router.post(
    "", response_model=GetPresetUserPositionResponseDTO
)
def add_preset_user_position(
    dto: AddPresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    logger.info(f"Adding: {dto.position_id} -> {dto.preset_user_id}")
    return add_preset_user_position_service(dto, db)


@preset_user_position_router.delete("", response_model=BaseResponseDTO)
def delete_preset_user_position(
    dto: DeletePresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    logger.info(f"Deleting: {dto.preset_user_position_id}")
    return delete_preset_user_position_service(dto, db)
