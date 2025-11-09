from sqlalchemy.orm import Session
from entities.position import Position
from dtos.position_dto import (
    AddPositionRequestDTO,
    UpdatePositionRequestDTO,
    GetPositionDetailResponseDTO,
    GetPositionListResponseDTO,
    PositionDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_position_detail_service(
    position_id: int, db: Session
) -> GetPositionDetailResponseDTO:
    try:
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )

        if not position:
            raise CustomException(404, "Position not found.")

        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="Position detail retrieved successfully.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def add_position_service(
    dto: AddPositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO:
    try:
        position = Position(
            auction_preset_user_id=dto.auction_preset_user_id, name=dto.name
        )
        db.add(position)
        db.commit()

        return get_position_detail_service(position.position_id, db)

    except Exception as e:
        handle_exception(e, db)


def get_position_list_service(db: Session) -> GetPositionListResponseDTO:
    try:
        positions = db.query(Position).all()
        position_dtos = [PositionDTO.model_validate(p) for p in positions]

        return GetPositionListResponseDTO(
            success=True,
            code=200,
            message="Position list retrieved successfully.",
            data=position_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_position_service(
    position_id: int, dto: UpdatePositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO:
    try:
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )
        if not position:
            raise CustomException(404, "Position not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(position, key, value)

        db.commit()

        return get_position_detail_service(position.position_id, db)

    except Exception as e:
        handle_exception(e, db)


def delete_position_service(
    position_id: int, db: Session
) -> BaseResponseDTO[None]:
    try:
        position = (
            db.query(Position)
            .filter(Position.position_id == position_id)
            .first()
        )
        if not position:
            raise CustomException(404, "Position not found")

        db.delete(position)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Position deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
