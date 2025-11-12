import os

from dotenv import load_dotenv

load_dotenv()


def get_app_host() -> str:
    return os.getenv("APP_HOST", "localhost")


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    return f"http://{get_app_host()}:8080/auction.html?token={token}"


def get_admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin")


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "jwt-secret")


def get_riot_api_key() -> str:
    return os.getenv("RIOT_API_KEY", "")
