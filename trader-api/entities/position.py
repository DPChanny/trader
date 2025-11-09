from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Position(Base):
    __tablename__ = "position"

    position_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_user_id = Column(
        Integer,
        ForeignKey("preset_user.preset_user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    name = Column(String(256), nullable=False)  # TOP, JUG, MID, SUP, BOT

    # Relationships
    preset_user = relationship("PresetUser", back_populates="positions")
