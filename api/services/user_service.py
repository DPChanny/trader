import logging

from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import (
    AddUserRequestDTO,
    UpdateUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
    UserDTO,
)
from entities.user import User
from services.discord_service import discord_service
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


async def get_user_detail_service(
    user_id: int, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()

        if not user:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found.")

        user_dto = UserDTO.model_validate(user)

        try:
            profile_url = await discord_service.get_profile_url(user.discord_id)
            user_dto.profile_url = profile_url
        except Exception:
            user_dto.profile_url = None

        return GetUserDetailResponseDTO(
            success=True,
            code=200,
            message="User detail retrieved successfully.",
            data=user_dto,
        )

    except Exception as e:
        handle_exception(e, db)


async def add_user_service(
    dto: AddUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = User(
            name=dto.name,
            riot_id=dto.riot_id,
            discord_id=dto.discord_id,
        )
        db.add(user)
        db.commit()

        logger.info(f"User added: {user.user_id}")
        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def get_user_list_service(db: Session) -> GetUserListResponseDTO | None:
    try:
        users = db.query(User).all()
        user_dtos = []

        for u in users:
            user_dto = UserDTO.model_validate(u)
            try:
                profile_url = await discord_service.get_profile_url(
                    u.discord_id
                )
                user_dto.profile_url = profile_url
            except Exception:
                user_dto.profile_url = None
            user_dtos.append(user_dto)

        return GetUserListResponseDTO(
            success=True,
            code=200,
            message="User list retrieved successfully.",
            data=user_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


async def update_user_service(
    user_id: int, dto: UpdateUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(user, key, value)

        db.commit()

        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


def delete_user_service(
    user_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        db.delete(user)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="User deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
