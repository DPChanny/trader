from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from utils.database import get_db
from dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.preset_user_position_service import (
    add_preset_user_position_service,
    delete_preset_user_position_service,
)

preset_user_position_router = APIRouter(
    prefix="/preset_user_position", tags=["preset_user_position"]
)


@preset_user_position_router.post(
    "", response_model=GetPresetUserPositionResponseDTO
)
def add_preset_user_position(
    dto: AddPresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    return add_preset_user_position_service(dto, db)


@preset_user_position_router.delete("", response_model=BaseResponseDTO)
def delete_preset_user_position(
    dto: DeletePresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    return delete_preset_user_position_service(dto, db)
