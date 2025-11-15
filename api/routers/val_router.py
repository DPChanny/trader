import logging

from fastapi import APIRouter

from dtos.val_dto import GetValResponseDTO
from services import val_service

logger = logging.getLogger(__name__)

val_router = APIRouter(prefix="/val", tags=["val"])


@val_router.get("/{user_id}", response_model=GetValResponseDTO)
async def get_val_route(user_id: int):
    logger.info(f"Fetching VAL: {user_id}")
    result = await val_service.get_val(user_id)

    if result is None:
        logger.warning(f"Not in cache: {user_id}")
        return GetValResponseDTO(
            success=False,
            code=404,
            message="VAL info not found in cache. Please wait for crawler to refresh.",
            data=None,
        )

    return result
