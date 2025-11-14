import logging

from fastapi import APIRouter

from dtos.val_dto import GetValResponseDTO
from services import val_service

logger = logging.getLogger(__name__)

val_router = APIRouter(prefix="/val", tags=["val"])


@val_router.get("/{user_id}", response_model=GetValResponseDTO)
async def get_val_route(user_id: int):
    logger.info(f"GET /api/val/{user_id} - Fetching VAL info")
    result = await val_service.get_val(user_id)

    if result is None:
        logger.warning(f"VAL info not found in cache for user {user_id}")
        return GetValResponseDTO(
            success=False,
            code=404,
            message="VAL info not found in cache. Please wait for crawler to refresh.",
            data=None,
        )

    return result
