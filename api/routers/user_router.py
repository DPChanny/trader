import logging
from types import NoneType

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import (
    AddUserRequestDTO,
    UpdateUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
)
from services.user_service import (
    add_user_service,
    delete_user_service,
    get_user_list_service,
    get_user_detail_service,
    update_user_service,
)
from utils.auth import verify_admin_token
from utils.database import get_db

logger = logging.getLogger(__name__)

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("/", response_model=GetUserDetailResponseDTO)
async def add_user_route(
    dto: AddUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Adding: {dto.name}")
    return await add_user_service(dto, db)


@user_router.get("/", response_model=GetUserListResponseDTO)
async def get_user_list_route(db: Session = Depends(get_db)):
    logger.info("Fetching list")
    return await get_user_list_service(db)


@user_router.get("/{user_id}", response_model=GetUserDetailResponseDTO)
async def get_user_detail_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching: {user_id}")
    return await get_user_detail_service(user_id, db)


@user_router.patch("/{user_id}", response_model=GetUserDetailResponseDTO)
async def update_user_route(
    user_id: int,
    dto: UpdateUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Updating: {user_id}")
    return await update_user_service(user_id, dto, db)


@user_router.delete("/{user_id}", response_model=BaseResponseDTO[NoneType])
def delete_user_route(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Deleting: {user_id}")
    return delete_user_service(user_id, db)
