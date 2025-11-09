from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class AuctionPresetTier(Base):
    __tablename__ = "auction_preset_tier"

    auction_preset_tier_id = Column(
        Integer, primary_key=True, autoincrement=True
    )
    auction_preset_id = Column(
        Integer,
        ForeignKey("auction_preset.auction_preset_id", ondelete="RESTRICT"),
        nullable=False,
    )
    name = Column(String(256), nullable=False)  # S, A, B, C 등

    # Relationships
    auction_preset = relationship("AuctionPreset", back_populates="tiers")
    auction_preset_users = relationship(
        "AuctionPresetUser", back_populates="tier"
    )
