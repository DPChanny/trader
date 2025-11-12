from fastapi import APIRouter, HTTPException

from dtos.lol_dto import RiotLolInfoDto
from services.lol_service import get_lol_info_by_user_id

lol_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_router.get("/{user_id}", response_model=RiotLolInfoDto)
async def get_lol_info(user_id: int):
    try:
        lol_info = await get_lol_info_by_user_id(user_id)
        return lol_info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch LoL info: {str(e)}"
        )
