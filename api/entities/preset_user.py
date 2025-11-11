from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from utils.database import Base


class PresetUser(Base):
    __tablename__ = "preset_user"

    preset_user_id = Column(Integer, primary_key=True, autoincrement=True)
    preset_id = Column(
        Integer,
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    tier_id = Column(
        Integer,
        ForeignKey("tier.tier_id", ondelete="SET NULL"),
        nullable=True,
    )

    preset = relationship("Preset", back_populates="preset_users")
    user = relationship("User", back_populates="preset_users")
    tier = relationship("Tier", back_populates="preset_users")
    positions = relationship(
        "Position",
        back_populates="preset_user",
        cascade="all, delete-orphan",
    )
