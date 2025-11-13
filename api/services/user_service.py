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

        # riot_id 변경 감지
        old_riot_id = user.riot_id
        riot_id_changed = False

        for key, value in dto.model_dump(exclude_unset=True).items():
            if key == "riot_id" and value != old_riot_id:
                riot_id_changed = True
            setattr(user, key, value)

        db.commit()

        # riot_id가 변경되었으면 캐시 갱신
        if riot_id_changed:
            logger.info(
                f"Riot ID changed for user {user_id}, refreshing game caches..."
            )
            # 캐시 갱신은 비동기로 수행 (차단하지 않음)
            import asyncio

            asyncio.create_task(
                _refresh_user_game_caches(user_id, user.riot_id)
            )

        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def _refresh_user_game_caches(user_id: int, riot_id: Optional[str]):
    """사용자의 게임 캐시를 갱신하거나 무효화"""
    try:
        from services import lol_service, val_service

        if riot_id and "#" in riot_id:
            # riot_id가 유효하면 캐시 갱신
            await lol_service.refresh_cache(user_id)
            await val_service.refresh_cache(user_id)
        else:
            # riot_id가 없거나 잘못된 형식이면 캐시 무효화
            lol_service.invalidate_cache(user_id)
            val_service.invalidate_cache(user_id)
            logger.info(
                f"Invalid or missing riot_id for user {user_id}, caches invalidated"
            )
    except Exception as e:
        logger.error(
            f"Error refreshing game caches for user {user_id}: {str(e)}"
        )


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
