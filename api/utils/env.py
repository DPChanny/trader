import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def get_app_host() -> str:
    return os.getenv("APP_HOST", "localhost")


def get_api_host() -> str:
    return os.getenv("API_HOST", "localhost")


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    return f"http://{get_app_host()}:8080/auction.html?token={token}"


def get_profile_url(discord_id: str) -> str:
    return f"http://{get_api_host()}:8000/profiles/{discord_id}.png"


def get_profile_dir() -> Path:
    profile_dir = Path(tempfile.gettempdir()) / "profiles"
    profile_dir.mkdir(exist_ok=True)
    return profile_dir


def get_profile_path(discord_id: str) -> Path:
    return get_profile_dir() / f"{discord_id}.png"


def get_admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin")


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "jwt-secret")
