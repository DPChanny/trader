from sqlalchemy.orm import Session, joinedload
from entities.preset_leader import PresetLeader
from dtos.preset_leader_dto import (
    AddPresetLeaderRequestDTO,
    UpdatePresetLeaderRequestDTO,
    GetPresetLeaderDetailResponseDTO,
    GetPresetLeaderListResponseDTO,
    PresetLeaderDTO,
    PresetLeaderDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_preset_leader_detail_service(
    preset_leader_id: int, db: Session
) -> GetPresetLeaderDetailResponseDTO:
    try:
        preset_leader = (
            db.query(PresetLeader)
            .options(
                joinedload(PresetLeader.user),
            )
            .filter(PresetLeader.preset_leader_id == preset_leader_id)
            .first()
        )

        if not preset_leader:
            raise CustomException(404, "Preset leader not found.")

        return GetPresetLeaderDetailResponseDTO(
            success=True,
            code=200,
            message="Preset leader detail retrieved successfully.",
            data=PresetLeaderDetailDTO.model_validate(preset_leader),
        )

    except Exception as e:
        handle_exception(e, db)


def add_preset_leader_service(
    dto: AddPresetLeaderRequestDTO, db: Session
) -> GetPresetLeaderDetailResponseDTO:
    try:
        preset_leader = PresetLeader(
            preset_id=dto.preset_id,
            user_id=dto.user_id,
        )
        db.add(preset_leader)
        db.commit()

        return get_preset_leader_detail_service(
            preset_leader.preset_leader_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def get_preset_leader_list_service(
    db: Session,
) -> GetPresetLeaderListResponseDTO:
    try:
        preset_leaders = db.query(PresetLeader).all()
        preset_leader_dtos = [
            PresetLeaderDTO.model_validate(pl) for pl in preset_leaders
        ]

        return GetPresetLeaderListResponseDTO(
            success=True,
            code=200,
            message="Preset leader list retrieved successfully.",
            data=preset_leader_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_preset_leader_service(
    preset_leader_id: int, dto: UpdatePresetLeaderRequestDTO, db: Session
) -> GetPresetLeaderDetailResponseDTO:
    try:
        preset_leader = (
            db.query(PresetLeader)
            .filter(PresetLeader.preset_leader_id == preset_leader_id)
            .first()
        )
        if not preset_leader:
            raise CustomException(404, "Preset leader not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset_leader, key, value)

        db.commit()

        return get_preset_leader_detail_service(
            preset_leader.preset_leader_id, db
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_leader_service(
    preset_leader_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        preset_leader = (
            db.query(PresetLeader)
            .filter(PresetLeader.preset_leader_id == preset_leader_id)
            .first()
        )
        if not preset_leader:
            raise CustomException(404, "Preset leader not found")

        db.delete(preset_leader)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Preset leader deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
