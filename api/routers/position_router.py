import logging
from types import NoneType

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import (
    AddPositionRequestDTO,
    UpdatePositionRequestDTO,
    GetPositionDetailResponseDTO,
    GetPositionListResponseDTO,
)
from services.position_service import (
    add_position_service,
    delete_position_service,
    get_position_list_service,
    get_position_detail_service,
    update_position_service,
)
from utils.auth import verify_admin_token
from utils.database import get_db

logger = logging.getLogger(__name__)

position_router = APIRouter(prefix="/position", tags=["position"])


@position_router.post("/", response_model=GetPositionDetailResponseDTO)
def add_position_route(
    dto: AddPositionRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"POST /api/position - Adding position: {dto.name}")
    return add_position_service(dto, db)


@position_router.get("/", response_model=GetPositionListResponseDTO)
def get_position_list_route(db: Session = Depends(get_db)):
    logger.info("GET /api/position - Fetching position list")
    return get_position_list_service(db)


@position_router.get("/{position_id}", response_model=GetPositionDetailResponseDTO)
def get_position_detail_route(position_id: int, db: Session = Depends(get_db)):
    logger.info(f"GET /api/position/{position_id} - Fetching position detail")
    return get_position_detail_service(position_id, db)


@position_router.patch("/{position_id}", response_model=GetPositionDetailResponseDTO)
def update_position_route(
    position_id: int,
    dto: UpdatePositionRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"PATCH /api/position/{position_id} - Updating position")
    return update_position_service(position_id, dto, db)


@position_router.delete("/{position_id}", response_model=BaseResponseDTO[NoneType])
def delete_position_route(
    position_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"DELETE /api/position/{position_id} - Deleting position")
    return delete_position_service(position_id, db)
