from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from utils.database import Base


class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(256), nullable=False, unique=True)
    riot_id = Column(String(256), nullable=False)
    discord_id = Column(String(256), nullable=False)

    preset_users = relationship("PresetUser", back_populates="user")
    preset_leaders = relationship("PresetLeader", back_populates="user")
