from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import database
import entities
import logging
import traceback

from routers.user_router import user_router
from routers.position_router import position_router
from routers.preset_router import preset_router
from routers.tier_router import tier_router
from routers.preset_user_router import preset_user_router
from routers.preset_leader_router import preset_leader_router
from routers.auction_router import auction_router
from routers.auction_websocket_router import auction_websocket_router
from services.discord_service import discord_service

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    database.init_engine()
    database.Base.metadata.create_all(bind=database.engine)

    await discord_service.start()

    yield

    logger.info("Shutting down application...")
    await discord_service.stop()


app = FastAPI(title="Trader Auction API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    error_msg = f"Global exception: {exc}"
    error_trace = traceback.format_exc()
    logger.error(error_msg)
    logger.error(error_trace)

    print("=" * 80)
    print("ERROR CAUGHT:")
    print(error_msg)
    print("-" * 80)
    print(error_trace)
    print("=" * 80)

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


app.include_router(user_router, prefix="/api/user")
app.include_router(position_router, prefix="/api/position")
app.include_router(preset_router, prefix="/api/preset")
app.include_router(tier_router, prefix="/api/tier")
app.include_router(preset_user_router, prefix="/api/preset-user")
app.include_router(preset_leader_router, prefix="/api/preset-leader")
app.include_router(auction_router, prefix="/api/auction")
app.include_router(auction_websocket_router, prefix="/ws/auction")


@app.get("/")
def read_root():
    return {"message": "Trader Auction API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
