from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base


class Tier(Base):
    __tablename__ = "tier"

    tier_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_id = Column(
        Integer,
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(256), nullable=False)

    preset = relationship("Preset", back_populates="tiers")
    preset_users = relationship("PresetUser", back_populates="tier")
