from sqlalchemy.orm import Session, joinedload
from entities.preset import Preset
from entities.preset_leader import PresetLeader
from entities.preset_user import PresetUser
from dtos.preset_dto import (
    AddPresetRequestDTO,
    UpdatePresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
    PresetDTO,
    PresetDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from utils.exception import CustomException, handle_exception
from services.discord_service import discord_service
import logging

logger = logging.getLogger(__name__)


async def get_preset_detail_service(
    preset_id: int, db: Session
) -> GetPresetDetailResponseDTO:
    try:
        logger.info(f"Fetching preset detail for preset_id: {preset_id}")
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users).joinedload(
                    PresetUser.positions
                ),
                joinedload(Preset.tiers),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            logger.warning(f"Preset not found: {preset_id}")
            raise CustomException(404, "Preset not found.")

        preset_dto = PresetDetailDTO.model_validate(preset)

        for preset_user in preset_dto.preset_users:
            if preset_user.user and preset.preset_users:
                user_entity = next(
                    (
                        pu.user
                        for pu in preset.preset_users
                        if pu.user_id == preset_user.user_id
                    ),
                    None,
                )
                if user_entity:
                    try:
                        profile_url = await discord_service.get_profile_url(
                            user_entity.discord_id
                        )
                        preset_user.user.profile_url = profile_url
                    except Exception:
                        preset_user.user.profile_url = None

        for preset_leader in preset_dto.preset_leaders:
            if preset_leader.user and preset.preset_leaders:
                leader_entity = next(
                    (
                        pl.user
                        for pl in preset.preset_leaders
                        if pl.user_id == preset_leader.user_id
                    ),
                    None,
                )
                if leader_entity:
                    try:
                        profile_url = await discord_service.get_profile_url(
                            leader_entity.discord_id
                        )
                        preset_leader.user.profile_url = profile_url
                    except Exception:
                        preset_leader.user.profile_url = None

        logger.info(
            f"Successfully retrieved preset detail for preset_id: {preset_id}"
        )
        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset detail retrieved successfully.",
            data=preset_dto,
        )

    except Exception as e:
        handle_exception(e, db)


def add_preset_service(
    dto: AddPresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO:
    try:
        logger.info(f"Creating new preset: {dto.name}")
        preset = Preset(
            name=dto.name,
            points=dto.points,
            time=dto.time,
            point_scale=dto.point_scale,
        )
        db.add(preset)
        db.commit()
        db.refresh(preset)

        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users).joinedload(
                    PresetUser.positions
                ),
                joinedload(Preset.tiers),
            )
            .filter(Preset.preset_id == preset.preset_id)
            .first()
        )

        logger.info(
            f"Preset added successfully: {preset.name} (ID: {preset.preset_id})"
        )
        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset added successfully.",
            data=PresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def get_preset_list_service(
    db: Session,
) -> GetPresetListResponseDTO:
    try:
        logger.info("Fetching preset list")
        presets = db.query(Preset).all()
        preset_dtos = [PresetDTO.model_validate(p) for p in presets]

        logger.info(f"Successfully retrieved {len(preset_dtos)} presets")
        return GetPresetListResponseDTO(
            success=True,
            code=200,
            message="Preset list retrieved successfully.",
            data=preset_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_preset_service(
    preset_id: int, dto: UpdatePresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO:
    try:
        logger.info(f"Updating preset: {preset_id}")
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            logger.warning(f"Preset not found for update: {preset_id}")
            raise CustomException(404, "Preset not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset, key, value)

        db.commit()
        db.refresh(preset)

        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_leaders).joinedload(PresetLeader.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users).joinedload(
                    PresetUser.positions
                ),
                joinedload(Preset.tiers),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        logger.info(f"Preset updated successfully: {preset_id}")
        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset updated successfully.",
            data=PresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_service(preset_id: int, db: Session) -> BaseResponseDTO[None]:
    try:
        logger.info(f"Deleting preset: {preset_id}")
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            logger.warning(f"Preset not found for deletion: {preset_id}")
            raise CustomException(404, "Preset not found")

        db.delete(preset)
        db.commit()

        logger.info(f"Preset deleted successfully: {preset_id}")
        return BaseResponseDTO(
            success=True,
            code=200,
            message="Preset deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
