from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dtos.preset_leader_dto import (
    AddPresetLeaderRequestDTO,
    UpdatePresetLeaderRequestDTO,
    GetPresetLeaderDetailResponseDTO,
    GetPresetLeaderListResponseDTO,
)
from dtos.base_dto import BaseResponseDTO
from services.preset_leader_service import (
    add_preset_leader_service,
    delete_preset_leader_service,
    get_preset_leader_list_service,
    get_preset_leader_detail_service,
    update_preset_leader_service,
)

preset_leader_router = APIRouter()


@preset_leader_router.post("/", response_model=GetPresetLeaderDetailResponseDTO)
def add_preset_leader_route(
    dto: AddPresetLeaderRequestDTO, db: Session = Depends(get_db)
):
    return add_preset_leader_service(dto, db)


@preset_leader_router.get("/", response_model=GetPresetLeaderListResponseDTO)
def get_preset_leader_list_route(db: Session = Depends(get_db)):
    return get_preset_leader_list_service(db)


@preset_leader_router.get(
    "/{preset_leader_id}", response_model=GetPresetLeaderDetailResponseDTO
)
def get_preset_leader_detail_route(
    preset_leader_id: int, db: Session = Depends(get_db)
):
    return get_preset_leader_detail_service(preset_leader_id, db)


@preset_leader_router.patch(
    "/{preset_leader_id}", response_model=GetPresetLeaderDetailResponseDTO
)
def update_preset_leader_route(
    preset_leader_id: int,
    dto: UpdatePresetLeaderRequestDTO,
    db: Session = Depends(get_db),
):
    return update_preset_leader_service(preset_leader_id, dto, db)


@preset_leader_router.delete(
    "/{preset_leader_id}", response_model=BaseResponseDTO[None]
)
def delete_preset_leader_route(
    preset_leader_id: int, db: Session = Depends(get_db)
):
    return delete_preset_leader_service(preset_leader_id, db)
