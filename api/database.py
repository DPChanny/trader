from sqlalchemy import create_engine, event
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

    # SQLite에서 외래키 제약조건 활성화
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
