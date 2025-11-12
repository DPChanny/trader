from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base

if TYPE_CHECKING:
    from entities.preset_user import PresetUser
    from entities.position import Position


class PresetUserPosition(Base):
    __tablename__ = "preset_user_position"
    __table_args__ = (
        UniqueConstraint(
            "preset_user_id", "position_id", name="uq_preset_user_position_user_pos"
        ),
    )

    preset_user_position_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True
    )
    preset_user_id: Mapped[int] = mapped_column(
        ForeignKey("preset_user.preset_user_id", ondelete="CASCADE"),
        nullable=False,
    )
    position_id: Mapped[int] = mapped_column(
        ForeignKey("position.position_id", ondelete="CASCADE"),
        nullable=False,
    )

    preset_user: Mapped[PresetUser] = relationship(
        "PresetUser", back_populates="preset_user_positions"
    )
    position: Mapped[Position] = relationship(
        "Position", back_populates="preset_user_positions"
    )
