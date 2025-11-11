import os
from dotenv import load_dotenv

load_dotenv()


def get_host() -> str:
    return os.getenv("HOST", "localhost")


def get_port() -> str:
    return os.getenv("PORT", "5173")


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    """Generate auction URL with the given token"""
    return f"http://{get_host()}:{get_port()}/auction.html?token={token}"
