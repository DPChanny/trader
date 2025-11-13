from fastapi import APIRouter, HTTPException

from dtos.val_dto import ValDto
from services.val_service import get_val_info_by_user_id

val_router = APIRouter(prefix="/val", tags=["val"])


@val_router.get("/{user_id}", response_model=ValDto)
async def get_val_info(user_id: int):
    try:
        val_info = await get_val_info_by_user_id(user_id)
        return val_info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch Valorant info: {str(e)}"
        )
