from __future__ import annotations

from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base

if TYPE_CHECKING:
    from entities.tier import Tier
    from entities.position import Position
    from entities.preset_user import PresetUser


class Preset(Base):
    __tablename__ = "preset"

    preset_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    points: Mapped[int] = mapped_column(nullable=False)
    time: Mapped[int] = mapped_column(nullable=False)
    point_scale: Mapped[int] = mapped_column(nullable=False)

    tiers: Mapped[List[Tier]] = relationship(
        "Tier",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    positions: Mapped[List[Position]] = relationship(
        "Position",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    preset_users: Mapped[List[PresetUser]] = relationship(
        "PresetUser",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
