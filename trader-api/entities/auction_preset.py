from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class AuctionPreset(Base):
    __tablename__ = "auction_preset"

    auction_preset_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False)

    # Relationships
    tiers = relationship(
        "AuctionPresetTier",
        back_populates="auction_preset",
        passive_deletes=True,
    )
    auction_preset_users = relationship(
        "AuctionPresetUser",
        back_populates="auction_preset",
        passive_deletes=True,
    )
