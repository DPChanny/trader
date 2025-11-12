from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from utils.database import Base


class PresetUserPosition(Base):
    __tablename__ = "preset_user_position"
    __table_args__ = (
        UniqueConstraint(
            "preset_user_id", "position_id", name="uq_preset_user_position_user_pos"
        ),
    )

    preset_user_position_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_user_id = Column(
        Integer,
        ForeignKey("preset_user.preset_user_id", ondelete="CASCADE"),
        nullable=False,
    )
    position_id = Column(
        Integer,
        ForeignKey("position.position_id", ondelete="CASCADE"),
        nullable=False,
    )

    preset_user = relationship("PresetUser", back_populates="preset_user_positions")
    position = relationship("Position", back_populates="preset_user_positions")
