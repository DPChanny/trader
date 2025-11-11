from typing import List, Optional
from pydantic import BaseModel
from dtos.base_dto import BaseResponseDTO


class UserDTO(BaseModel):
    user_id: int
    name: str
    riot_id: str
    discord_id: str
    profile_url: Optional[str] = None

    model_config = {"from_attributes": True}


class AddUserRequestDTO(BaseModel):
    name: str
    riot_id: str
    discord_id: str


class UpdateUserRequestDTO(BaseModel):
    name: Optional[str] = None
    riot_id: Optional[str] = None
    discord_id: Optional[str] = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[List[UserDTO]]):
    pass
