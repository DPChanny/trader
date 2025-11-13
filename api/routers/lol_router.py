import logging

from fastapi import APIRouter

from dtos.lol_dto import GetLolResponseDTO
from services import lol_service

logger = logging.getLogger(__name__)

lol_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_router.get("/{user_id}", response_model=GetLolResponseDTO)
async def get_lol_route(user_id: int):
    logger.info(f"GET /api/lol/{user_id} - Fetching LOL info")
    return await lol_service.get_lol(user_id)
