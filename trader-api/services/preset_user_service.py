from sqlalchemy.orm import Session, joinedload
from entities.preset_user import PresetUser
from dtos.preset_user_dto import (
    AddPresetUserRequestDTO,
    UpdatePresetUserRequestDTO,
    GetPresetUserDetailResponseDTO,
    GetPresetUserListResponseDTO,
    PresetUserDTO,
    PresetUserDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_preset_user_detail_service(
    preset_user_id: int, db: Session
) -> GetPresetUserDetailResponseDTO:
    try:
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
            raise CustomException(404, "Preset user not found.")

        return GetPresetUserDetailResponseDTO(
            success=True,
            code=200,
            message="Preset user detail retrieved successfully.",
            data=PresetUserDetailDTO.model_validate(preset_user),
        )

    except Exception as e:
        handle_exception(e, db)


def add_preset_user_service(
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

        return get_preset_user_detail_service(preset_user.preset_user_id, db)

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


def update_preset_user_service(
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

        return get_preset_user_detail_service(preset_user.preset_user_id, db)

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
