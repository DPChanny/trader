from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class Preset(Base):
    __tablename__ = "preset"

    preset_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False)

    # Relationships
    tiers = relationship(
        "Tier",
        back_populates="preset",
    )
    preset_users = relationship(
        "PresetUser",
        back_populates="preset",
    )
    preset_leaders = relationship(
        "PresetLeader",
        back_populates="preset",
    )
