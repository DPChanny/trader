from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from utils.database import Base


class Preset(Base):
    __tablename__ = "preset"

    preset_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False)
    points = Column(Integer, nullable=False)
    time = Column(Integer, nullable=False)
    point_scale = Column(Integer, nullable=False)

    tiers = relationship(
        "Tier",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    positions = relationship(
        "Position",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    preset_users = relationship(
        "PresetUser",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
