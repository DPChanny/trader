import logging

from fastapi import APIRouter

from dtos.lol_dto import GetLolResponseDTO
from services import lol_service

logger = logging.getLogger(__name__)

lol_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_router.get("/{user_id}", response_model=GetLolResponseDTO)
async def get_lol_route(user_id: int):
    logger.info(f"Fetching LOL: {user_id}")
    result = await lol_service.get_lol(user_id)

    if result is None:
        logger.warning(f"Not in cache: {user_id}")
        return GetLolResponseDTO(
            success=False,
            code=404,
            message="LOL info not found in cache. Please wait for crawler to refresh.",
            data=None,
        )

    return result
