from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class AuctionPresetUser(Base):
    __tablename__ = "auction_preset_user"

    auction_preset_user_id = Column(
        Integer, primary_key=True, autoincrement=True
    )
    auction_preset_id = Column(
        Integer,
        ForeignKey("auction_preset.auction_preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    auction_preset_tier_id = Column(
        Integer,
        ForeignKey(
            "auction_preset_tier.auction_preset_tier_id", ondelete="CASCADE"
        ),
        nullable=False,
    )

    # Relationships
    auction_preset = relationship(
        "AuctionPreset", back_populates="auction_preset_users"
    )
    user = relationship("User", back_populates="auction_preset_users")
    tier = relationship(
        "AuctionPresetTier", back_populates="auction_preset_users"
    )
