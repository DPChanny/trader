from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.position_dto import (
    AddPositionRequestDTO,
    UpdatePositionRequestDTO,
    GetPositionDetailResponseDTO,
    GetPositionListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.position_service import (
    add_position_service,
    delete_position_service,
    get_position_list_service,
    get_position_detail_service,
    update_position_service,
)

position_router = APIRouter()


@position_router.post("/", response_model=GetPositionDetailResponseDTO)
def add_position_route(
    dto: AddPositionRequestDTO, db: Session = Depends(get_db)
):
    return add_position_service(dto, db)


@position_router.get("/", response_model=GetPositionListResponseDTO)
def get_position_list_route(db: Session = Depends(get_db)):
    return get_position_list_service(db)


@position_router.get(
    "/{position_id}", response_model=GetPositionDetailResponseDTO
)
def get_position_detail_route(position_id: int, db: Session = Depends(get_db)):
    return get_position_detail_service(position_id, db)


@position_router.patch(
    "/{position_id}", response_model=GetPositionDetailResponseDTO
)
def update_position_route(
    position_id: int,
    dto: UpdatePositionRequestDTO,
    db: Session = Depends(get_db),
):
    return update_position_service(position_id, dto, db)


@position_router.delete("/{position_id}", response_model=BaseResponseDTO[None])
def delete_position_route(position_id: int, db: Session = Depends(get_db)):
    return delete_position_service(position_id, db)
