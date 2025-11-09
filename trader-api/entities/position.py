from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Position(Base):
    __tablename__ = "position"

    position_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(256), nullable=False)  # TOP, JUG, MID, SUP, BOT

    # Relationships
    user = relationship("User", back_populates="positions")
