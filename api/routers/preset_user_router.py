import logging
from types import NoneType

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.preset_user_dto import (
    AddPresetUserRequestDTO,
    UpdatePresetUserRequestDTO,
    GetPresetUserDetailResponseDTO,
    GetPresetUserListResponseDTO,
)
from services.preset_user_service import (
    add_preset_user_service,
    delete_preset_user_service,
    get_preset_user_list_service,
    get_preset_user_detail_service,
    update_preset_user_service,
)
from utils.auth import verify_admin_token
from utils.database import get_db

logger = logging.getLogger(__name__)

preset_user_router = APIRouter(prefix="/preset_user", tags=["preset_user"])


@preset_user_router.post("/", response_model=GetPresetUserDetailResponseDTO)
async def add_preset_user_route(
    dto: AddPresetUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Adding preset user")
    return await add_preset_user_service(dto, db)


@preset_user_router.get("/", response_model=GetPresetUserListResponseDTO)
def get_preset_user_list_route(db: Session = Depends(get_db)):
    logger.info("Fetching list")
    return get_preset_user_list_service(db)


@preset_user_router.get(
    "/{preset_user_id}", response_model=GetPresetUserDetailResponseDTO
)
async def get_preset_user_detail_route(
    preset_user_id: int, db: Session = Depends(get_db)
):
    logger.info(f"Fetching: {preset_user_id}")
    return await get_preset_user_detail_service(preset_user_id, db)


@preset_user_router.patch(
    "/{preset_user_id}", response_model=GetPresetUserDetailResponseDTO
)
async def update_preset_user_route(
    preset_user_id: int,
    dto: UpdatePresetUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Updating: {preset_user_id}")
    return await update_preset_user_service(preset_user_id, dto, db)


@preset_user_router.delete(
    "/{preset_user_id}", response_model=BaseResponseDTO[NoneType]
)
def delete_preset_user_route(
    preset_user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Deleting: {preset_user_id}")
    return delete_preset_user_service(preset_user_id, db)
