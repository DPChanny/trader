from __future__ import annotations

from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base

if TYPE_CHECKING:
    from entities.preset import Preset
    from entities.preset_user import PresetUser


class Tier(Base):
    __tablename__ = "tier"

    tier_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)

    preset: Mapped[Preset] = relationship("Preset", back_populates="tiers")
    preset_users: Mapped[List[PresetUser]] = relationship(
        "PresetUser", back_populates="tier"
    )
