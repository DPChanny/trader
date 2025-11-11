from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from utils.database import Base


class Preset(Base):
    __tablename__ = "preset"

    preset_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False)
    points = Column(Integer, nullable=False, default=1000)
    time = Column(Integer, nullable=False, default=30)

    tiers = relationship(
        "Tier",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    preset_users = relationship(
        "PresetUser",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    preset_leaders = relationship(
        "PresetLeader",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
