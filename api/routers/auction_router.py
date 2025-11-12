from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session
import logging

from utils.database import get_db
from services.auction_service import add_auction_service
from dtos.auction_dto import (
    AddAuctionResponseDTO,
)

logger = logging.getLogger(__name__)

auction_router = APIRouter(prefix="/auction", tags=["auction"])


@auction_router.post("/{preset_id}", response_model=AddAuctionResponseDTO)
async def add_auction_route(
    preset_id: int, db: Session = Depends(get_db)
) -> AddAuctionResponseDTO:
    logger.info(f"POST /api/auction/{preset_id} - Creating auction")
    return add_auction_service(preset_id, db)
