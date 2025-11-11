from sqlalchemy.orm import Session, joinedload
from entities.preset_user import PresetUser
from entities.preset_leader import PresetLeader
from dtos.preset_user_dto import (
    AddPresetUserRequestDTO,
    UpdatePresetUserRequestDTO,
    GetPresetUserDetailResponseDTO,
    GetPresetUserListResponseDTO,
    PresetUserDTO,
    PresetUserDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import UserDTO
from exception import CustomException, handle_exception
from services.discord_service import discord_service
import logging

logger = logging.getLogger(__name__)


async def get_preset_user_detail_service(
    preset_user_id: int, db: Session
) -> GetPresetUserDetailResponseDTO:
    try:
        logger.info(
            f"Fetching preset user detail for preset_user_id: {preset_user_id}"
        )
        preset_user = (
            db.query(PresetUser)
            .options(
                joinedload(PresetUser.user),
                joinedload(PresetUser.tier),
                joinedload(PresetUser.positions),
            )
            .filter(PresetUser.preset_user_id == preset_user_id)
            .first()
        )

        if not preset_user:
            logger.warning(f"Preset user not found: {preset_user_id}")
            raise CustomException(404, "Preset user not found.")

        preset_user_dto = PresetUserDetailDTO.model_validate(preset_user)

        if preset_user_dto.user and preset_user.user.discord_id:
            profile_url = await discord_service.get_profile_url(
                preset_user.user.discord_id
            )
            preset_user_dto.user.profile_url = profile_url

        return GetPresetUserDetailResponseDTO(
            success=True,
            code=200,
            message="Preset user detail retrieved successfully.",
            data=preset_user_dto,
        )

    except Exception as e:
        handle_exception(e, db)


async def add_preset_user_service(
    dto: AddPresetUserRequestDTO, db: Session
) -> GetPresetUserDetailResponseDTO:
    try:
        preset_user = PresetUser(
            preset_id=dto.preset_id,
            user_id=dto.user_id,
            tier_id=dto.tier_id,
        )
        db.add(preset_user)
        db.commit()
        db.refresh(preset_user)

        preset_user = (
            db.query(PresetUser)
            .options(
                joinedload(PresetUser.user),
                joinedload(PresetUser.tier),
                joinedload(PresetUser.positions),
            )
            .filter(PresetUser.preset_user_id == preset_user.preset_user_id)
            .first()
        )

        preset_user_dto = PresetUserDetailDTO.model_validate(preset_user)

        if preset_user_dto.user and preset_user.user.discord_id:
            profile_url = await discord_service.get_profile_url(
                preset_user.user.discord_id
            )
            preset_user_dto.user.profile_url = profile_url

        return GetPresetUserDetailResponseDTO(
            success=True,
            code=200,
            message="Preset user added successfully.",
            data=preset_user_dto,
        )

    except Exception as e:
        handle_exception(e, db)


def get_preset_user_list_service(
    db: Session,
) -> GetPresetUserListResponseDTO:
    try:
        preset_users = db.query(PresetUser).all()
        preset_user_dtos = [
            PresetUserDTO.model_validate(pu) for pu in preset_users
        ]

        return GetPresetUserListResponseDTO(
            success=True,
            code=200,
            message="Preset user list retrieved successfully.",
            data=preset_user_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


async def update_preset_user_service(
    preset_user_id: int, dto: UpdatePresetUserRequestDTO, db: Session
) -> GetPresetUserDetailResponseDTO:
    try:
        preset_user = (
            db.query(PresetUser)
            .filter(PresetUser.preset_user_id == preset_user_id)
            .first()
        )
        if not preset_user:
            raise CustomException(404, "Preset user not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset_user, key, value)

        db.commit()
        db.refresh(preset_user)

        preset_user = (
            db.query(PresetUser)
            .options(
                joinedload(PresetUser.user),
                joinedload(PresetUser.tier),
                joinedload(PresetUser.positions),
            )
            .filter(PresetUser.preset_user_id == preset_user_id)
            .first()
        )

        preset_user_dto = PresetUserDetailDTO.model_validate(preset_user)

        if preset_user_dto.user and preset_user.user.discord_id:
            profile_url = await discord_service.get_profile_url(
                preset_user.user.discord_id
            )
            preset_user_dto.user.profile_url = profile_url

        return GetPresetUserDetailResponseDTO(
            success=True,
            code=200,
            message="Preset user updated successfully.",
            data=preset_user_dto,
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_user_service(
    preset_user_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        preset_user = (
            db.query(PresetUser)
            .filter(PresetUser.preset_user_id == preset_user_id)
            .first()
        )
        if not preset_user:
            raise CustomException(404, "Preset user not found")

        db.query(PresetLeader).filter(
            PresetLeader.preset_id == preset_user.preset_id,
            PresetLeader.user_id == preset_user.user_id,
        ).delete()

        db.delete(preset_user)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Preset user deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
