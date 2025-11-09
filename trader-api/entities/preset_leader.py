from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class PresetLeader(Base):
    __tablename__ = "preset_leader"

    preset_leader_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_id = Column(
        Integer,
        ForeignKey("preset.preset_id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    preset = relationship("Preset", back_populates="preset_leaders")
    user = relationship("User", back_populates="preset_leaders")
