from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.tier_dto import (
    AddTierRequestDTO,
    UpdateTierRequestDTO,
    GetTierDetailResponseDTO,
    GetTierListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.tier_service import (
    add_tier_service,
    delete_tier_service,
    get_tier_list_service,
    get_tier_detail_service,
    update_tier_service,
)
import logging

logger = logging.getLogger(__name__)

tier_router = APIRouter()


@tier_router.post("/", response_model=GetTierDetailResponseDTO)
def add_tier_route(dto: AddTierRequestDTO, db: Session = Depends(get_db)):
    logger.info(f"POST /api/tier - Adding tier: {dto.name}")
    return add_tier_service(dto, db)


@tier_router.get("/", response_model=GetTierListResponseDTO)
def get_tier_list_route(db: Session = Depends(get_db)):
    logger.info("GET /api/tier - Fetching tier list")
    return get_tier_list_service(db)


@tier_router.get("/{tier_id}", response_model=GetTierDetailResponseDTO)
def get_tier_detail_route(tier_id: int, db: Session = Depends(get_db)):
    logger.info(f"GET /api/tier/{tier_id} - Fetching tier detail")
    return get_tier_detail_service(tier_id, db)


@tier_router.patch("/{tier_id}", response_model=GetTierDetailResponseDTO)
def update_tier_route(
    tier_id: int,
    dto: UpdateTierRequestDTO,
    db: Session = Depends(get_db),
):
    logger.info(f"PATCH /api/tier/{tier_id} - Updating tier")
    return update_tier_service(tier_id, dto, db)


@tier_router.delete("/{tier_id}", response_model=BaseResponseDTO[None])
def delete_tier_route(tier_id: int, db: Session = Depends(get_db)):
    logger.info(f"DELETE /api/tier/{tier_id} - Deleting tier")
    return delete_tier_service(tier_id, db)
