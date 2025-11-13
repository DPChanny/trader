import logging

from fastapi import APIRouter

from dtos.val_dto import GetValResponseDTO
from services import val_service

logger = logging.getLogger(__name__)

val_router = APIRouter(prefix="/val", tags=["val"])


@val_router.get("/{user_id}", response_model=GetValResponseDTO)
async def get_val_route(user_id: int):
    logger.info(f"GET /api/val/{user_id} - Fetching VAL info")
    return await val_service.get_val(user_id)
