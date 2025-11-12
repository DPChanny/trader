import logging

from utils.env import get_admin_password
from utils.jwt import create_jwt_token, refresh_jwt_token, should_refresh_token

logger = logging.getLogger(__name__)


def verify_admin_password(password: str) -> bool:
    return password == get_admin_password()


def generate_admin_token() -> str:
    payload = {"role": "admin", "type": "admin_access"}
    return create_jwt_token(payload)


def refresh_admin_token(token: str) -> str:
    return refresh_jwt_token(token)


def check_should_refresh(token: str) -> bool:
    return should_refresh_token(token)
