from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    nickname = Column(String(256), nullable=False)
    riot_nickname = Column(String(256), nullable=False)
    access_code = Column(String(256), nullable=False, unique=True)

    # Relationships
    auction_preset_users = relationship(
        "AuctionPresetUser", back_populates="user"
    )
