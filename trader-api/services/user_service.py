from sqlalchemy.orm import Session, joinedload
from entities.user import User
from dtos.user_dto import (
    AddUserRequestDTO,
    UpdateUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
    UserDTO,
    UserDetailDTO,
)
from dtos.base_dto import BaseResponseDTO
from exception import CustomException, handle_exception


def get_user_detail_service(
    user_id: int, db: Session
) -> GetUserDetailResponseDTO:
    try:
        user = (
            db.query(User)
            .options(joinedload(User.positions))
            .filter(User.user_id == user_id)
            .first()
        )

        if not user:
            raise CustomException(404, "User not found.")

        return GetUserDetailResponseDTO(
            success=True,
            code=200,
            message="User detail retrieved successfully.",
            data=UserDetailDTO.model_validate(user),
        )

    except Exception as e:
        handle_exception(e, db)


def add_user_service(
    dto: AddUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO:
    try:
        user = User(
            nickname=dto.nickname,
            riot_nickname=dto.riot_nickname,
            access_code=dto.access_code,
        )
        db.add(user)
        db.commit()

        return get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


def get_user_list_service(db: Session) -> GetUserListResponseDTO:
    try:
        users = db.query(User).all()
        user_dtos = [UserDTO.model_validate(u) for u in users]

        return GetUserListResponseDTO(
            success=True,
            code=200,
            message="User list retrieved successfully.",
            data=user_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_user_service(
    user_id: int, dto: UpdateUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise CustomException(404, "User not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(user, key, value)

        db.commit()

        return get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


def delete_user_service(user_id: int, db: Session) -> BaseResponseDTO[None]:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
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
