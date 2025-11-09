from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./trader.db"

engine = None
SessionLocal = None
Base = declarative_base()


def init_engine():
    global engine, SessionLocal

    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}, echo=True
    )
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
