from __future__ import annotations

from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base

if TYPE_CHECKING:
    from entities.preset_user import PresetUser


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, unique=True)
    riot_id: Mapped[str] = mapped_column(String(256), nullable=False)
    discord_id: Mapped[str] = mapped_column(String(256), nullable=False)

    preset_users: Mapped[List[PresetUser]] = relationship(
        "PresetUser", back_populates="user"
    )
