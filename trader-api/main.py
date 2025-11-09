from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database
import entities

from routers.user_router import user_router
from routers.position_router import position_router
from routers.preset_router import preset_router
from routers.tier_router import tier_router
from routers.preset_user_router import preset_user_router

app = FastAPI(title="Trader Auction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    database.init_engine()
    database.Base.metadata.create_all(bind=database.engine)


app.include_router(user_router, prefix="/api/user")
app.include_router(position_router, prefix="/api/position")
app.include_router(preset_router, prefix="/api/preset")
app.include_router(tier_router, prefix="/api/tier")
app.include_router(preset_user_router, prefix="/api/preset-user")


@app.get("/")
def read_root():
    return {"message": "Trader Auction API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
