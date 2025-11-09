from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Preset(Base):
    __tablename__ = "preset"

    preset_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False)
    user_id = Column(
        Integer, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    tiers = relationship(
        "Tier",
        back_populates="preset",
    )
    preset_users = relationship(
        "PresetUser",
        back_populates="preset",
    )
