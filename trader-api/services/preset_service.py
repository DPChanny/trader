from sqlalchemy.orm import Session, joinedload
from entities.preset import Preset
from dtos.preset_dto import (
    AddPresetRequestDTO,
    UpdatePresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
    PresetDTO,
    PresetDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_preset_detail_service(
    preset_id: int, db: Session
) -> GetPresetDetailResponseDTO:
    try:
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.tiers),
                joinedload(Preset.preset_users),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            raise CustomException(404, "Preset not found.")

        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset detail retrieved successfully.",
            data=PresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def add_preset_service(
    dto: AddPresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO:
    try:
        preset = Preset(name=dto.name, user_id=dto.user_id)
        db.add(preset)
        db.commit()

        return get_preset_detail_service(preset.preset_id, db)

    except Exception as e:
        handle_exception(e, db)


def get_preset_list_service(
    db: Session,
) -> GetPresetListResponseDTO:
    try:
        presets = db.query(Preset).all()
        preset_dtos = [PresetDTO.model_validate(p) for p in presets]

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
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            raise CustomException(404, "Preset not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset, key, value)

        db.commit()

        return get_preset_detail_service(preset.preset_id, db)

    except Exception as e:
        handle_exception(e, db)


def delete_preset_service(preset_id: int, db: Session) -> BaseResponseDTO[None]:
    try:
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            raise CustomException(404, "Preset not found")

        db.delete(preset)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Preset deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
