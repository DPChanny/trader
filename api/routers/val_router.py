from fastapi import APIRouter, HTTPException
from dtos.val_dto import RiotValInfoDto
from services.val_service import get_val_info_by_user_id

val_router = APIRouter(prefix="/val", tags=["val"])


@val_router.get("/{user_id}", response_model=RiotValInfoDto)
async def get_val_info(user_id: int):
    """
    User ID로 발로란트 계정 정보 조회

    - user_id를 통해 DB에서 riot_id를 가져옴
    - riot_id를 gameName#tagLine 형식으로 파싱
    - Riot API를 통해 발로란트 계정 정보 및 주 에이전트 2개의 통계 조회
    """
    try:
        val_info = await get_val_info_by_user_id(user_id)
        return val_info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch Valorant info: {str(e)}"
        )
