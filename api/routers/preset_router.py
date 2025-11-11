from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.preset_dto import (
    AddPresetRequestDTO,
    UpdatePresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.preset_service import (
    add_preset_service,
    delete_preset_service,
    get_preset_list_service,
    get_preset_detail_service,
    update_preset_service,
)

preset_router = APIRouter()


@preset_router.post("/", response_model=GetPresetDetailResponseDTO)
def add_preset_route(dto: AddPresetRequestDTO, db: Session = Depends(get_db)):
    return add_preset_service(dto, db)


@preset_router.get("/", response_model=GetPresetListResponseDTO)
def get_preset_list_route(db: Session = Depends(get_db)):
    return get_preset_list_service(db)


@preset_router.get("/{preset_id}", response_model=GetPresetDetailResponseDTO)
def get_preset_detail_route(preset_id: int, db: Session = Depends(get_db)):
    return get_preset_detail_service(preset_id, db)


@preset_router.patch("/{preset_id}", response_model=GetPresetDetailResponseDTO)
def update_preset_route(
    preset_id: int,
    dto: UpdatePresetRequestDTO,
    db: Session = Depends(get_db),
):
    return update_preset_service(preset_id, dto, db)


@preset_router.delete("/{preset_id}", response_model=BaseResponseDTO[None])
def delete_preset_route(preset_id: int, db: Session = Depends(get_db)):
    return delete_preset_service(preset_id, db)
