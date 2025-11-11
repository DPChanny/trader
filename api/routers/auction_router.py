from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from database import get_db
from services.auction_service import add_auction_service
from dtos.auction_dto import (
    AddAuctionResponseDTO,
)

auction_router = APIRouter()


@auction_router.post("/{preset_id}", response_model=AddAuctionResponseDTO)
async def add_auction_route(
    preset_id: int, db: Session = Depends(get_db)
) -> AddAuctionResponseDTO:
    return add_auction_service(preset_id, db)
