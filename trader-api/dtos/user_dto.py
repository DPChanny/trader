from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO


# User DTOs
class UserDTO(BaseModel):
    user_id: int
    nickname: str
    riot_nickname: str
    access_code: str

    model_config = {"from_attributes": True}


class AddUserRequestDTO(BaseModel):
    nickname: str
    riot_nickname: str
    access_code: str


class UpdateUserRequestDTO(BaseModel):
    nickname: Optional[str] = None
    riot_nickname: Optional[str] = None
    access_code: Optional[str] = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[List[UserDTO]]):
    pass
