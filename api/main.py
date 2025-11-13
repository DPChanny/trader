import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import utils.database as database
from routers.admin_router import admin_router
from routers.auction_router import auction_router
from routers.auction_websocket_router import auction_websocket_router
from routers.lol_router import lol_router
from routers.position_router import position_router
from routers.preset_router import preset_router
from routers.preset_user_position_router import preset_user_position_router
from routers.preset_user_router import preset_user_router
from routers.tier_router import tier_router
from routers.user_router import user_router
from routers.val_router import val_router
from services.discord_service import discord_service

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s",
)

logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("discord").setLevel(logging.WARNING)
logging.getLogger("discord.client").setLevel(logging.WARNING)
logging.getLogger("discord.gateway").setLevel(logging.WARNING)
logging.getLogger("discord.http").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_):
    database.init_engine()

    # Run database migrations
    from sqlalchemy import inspect, text

    inspector = inspect(database.engine)

    # Create all tables
    database.Base.metadata.create_all(bind=database.engine)

    # Check if statistics column exists in preset table
    columns = [col["name"] for col in inspector.get_columns("preset")]
    if "statistics" not in columns:
        logger.info("Adding statistics column to preset table")
        with database.engine.begin() as conn:
            # Add column as nullable first
            conn.execute(
                text("ALTER TABLE preset ADD COLUMN statistics VARCHAR")
            )
            # Set default value for existing rows
            conn.execute(
                text(
                    "UPDATE preset SET statistics = 'NONE' WHERE statistics IS NULL"
                )
            )
            logger.info("Statistics column added successfully")

    # Selenium 드라이버 미리 초기화
    from utils.crawler import get_global_driver, cleanup_driver

    logger.info("Initializing Selenium driver...")
    await get_global_driver()
    logger.info("Selenium driver initialized successfully")

    # 게임 캐시 서비스 시작
    from services import lol_service, val_service

    logger.info("Starting LOL cache service...")
    await lol_service.start_lol_cache_service()
    logger.info("LOL cache service started successfully")

    logger.info("Starting VAL cache service...")
    await val_service.start_val_cache_service()
    logger.info("VAL cache service started successfully")

    await discord_service.start()
    yield

    # 리소스 정리
    await discord_service.stop()
    await lol_service.stop_lol_cache_service()
    await val_service.stop_val_cache_service()
    await cleanup_driver()


app = FastAPI(title="Trader Auction API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    error_msg = f"Global exception: {exc}"
    error_trace = traceback.format_exc()

    logger.error("=" * 80)
    logger.error(f"ERROR CAUGHT: {error_msg}")
    logger.error("-" * 80)
    logger.error(error_trace)
    logger.error("=" * 80)

    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=500, content={"detail": str(exc), "traceback": error_trace}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router, prefix="/api")
app.include_router(position_router, prefix="/api")
app.include_router(preset_router, prefix="/api")
app.include_router(tier_router, prefix="/api")
app.include_router(preset_user_router, prefix="/api")
app.include_router(preset_user_position_router, prefix="/api")
app.include_router(auction_router, prefix="/api")
app.include_router(auction_websocket_router, prefix="/ws")
app.include_router(admin_router, prefix="/api")
app.include_router(lol_router, prefix="/api")
app.include_router(val_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Trader Auction API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
