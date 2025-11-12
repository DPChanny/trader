import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.preset_dto import (
    AddPresetRequestDTO,
    UpdatePresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
)
from services.preset_service import (
    add_preset_service,
    delete_preset_service,
    get_preset_list_service,
    get_preset_detail_service,
    update_preset_service,
)
from utils.auth import verify_admin_token
from utils.database import get_db

logger = logging.getLogger(__name__)

preset_router = APIRouter(prefix="/preset", tags=["preset"])


@preset_router.post("/", response_model=GetPresetDetailResponseDTO)
def add_preset_route(
    dto: AddPresetRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"POST /api/preset - Adding preset: {dto.name}")
    return add_preset_service(dto, db)


@preset_router.get("/", response_model=GetPresetListResponseDTO)
def get_preset_list_route(db: Session = Depends(get_db)):
    logger.info("GET /api/preset - Fetching preset list")
    return get_preset_list_service(db)


@preset_router.get("/{preset_id}", response_model=GetPresetDetailResponseDTO)
async def get_preset_detail_route(preset_id: int, db: Session = Depends(get_db)):
    logger.info(f"GET /api/preset/{preset_id} - Fetching preset detail")
    return await get_preset_detail_service(preset_id, db)


@preset_router.patch("/{preset_id}", response_model=GetPresetDetailResponseDTO)
def update_preset_route(
    preset_id: int,
    dto: UpdatePresetRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"PATCH /api/preset/{preset_id} - Updating preset")
    return update_preset_service(preset_id, dto, db)


@preset_router.delete("/{preset_id}", response_model=BaseResponseDTO[None])
def delete_preset_route(
    preset_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"DELETE /api/preset/{preset_id} - Deleting preset")
    return delete_preset_service(preset_id, db)
