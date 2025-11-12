from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from utils.database import Base


class Position(Base):
    __tablename__ = "position"

    position_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_id = Column(
        Integer,
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(256), nullable=False)  # TOP, JUG, MID, SUP, BOT
    icon_url = Column(String(512), nullable=True)  # 포지션 아이콘 URL

    preset = relationship("Preset", back_populates="positions")
    preset_user_positions = relationship(
        "PresetUserPosition",
        back_populates="position",
        cascade="all, delete-orphan",
    )
