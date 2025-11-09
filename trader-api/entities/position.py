from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Position(Base):
    __tablename__ = "position"

    position_id = Column(Integer, primary_key=True, autoincrement=True)
    auction_preset_user_id = Column(
        Integer,
        ForeignKey(
            "auction_preset_user.auction_preset_user_id", ondelete="RESTRICT"
        ),
        nullable=False,
    )
    name = Column(String(256), nullable=False)  # TOP, JUG, MID, SUP, BOT

    # Relationships
    auction_preset_user = relationship(
        "AuctionPresetUser", back_populates="position"
    )
