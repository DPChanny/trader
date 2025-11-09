from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO
from dtos.position_dto import PositionDTO


# User DTOs
class UserDTO(BaseModel):
    user_id: int
    nickname: str
    riot_nickname: str
    access_code: str

    model_config = {"from_attributes": True}


class UserDetailDTO(UserDTO):
    positions: List[PositionDTO] = []


class AddUserRequestDTO(BaseModel):
    nickname: str
    riot_nickname: str
    access_code: str


class UpdateUserRequestDTO(BaseModel):
    nickname: Optional[str] = None
    riot_nickname: Optional[str] = None
    access_code: Optional[str] = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDetailDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[List[UserDTO]]):
    pass
