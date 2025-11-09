from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class BaseResponseDTO(BaseModel, Generic[T]):
    success: bool
    code: int
    message: str
    data: Optional[T] = None
