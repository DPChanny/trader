import os
from dotenv import load_dotenv

load_dotenv()


def get_app_host() -> str:
    return os.getenv("APP_HOST", "localhost")


def get_app_port() -> str:
    return os.getenv("APP_PORT", "8080")


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    """Generate auction URL with the given token"""
    return (
        f"http://{get_app_host()}:{get_app_port()}/auction.html?token={token}"
    )
