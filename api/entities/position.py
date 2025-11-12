from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base

if TYPE_CHECKING:
    from entities.preset import Preset
    from entities.preset_user_position import PresetUserPosition


class Position(Base):
    __tablename__ = "position"

    position_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    preset: Mapped[Preset] = relationship("Preset", back_populates="positions")
    preset_user_positions: Mapped[List[PresetUserPosition]] = relationship(
        "PresetUserPosition",
        back_populates="position",
        cascade="all, delete-orphan",
    )
