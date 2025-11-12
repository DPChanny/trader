from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class BaseResponseDTO(BaseModel, Generic[T]):
    success: bool
    code: int
    message: str
    data: T | None = None
