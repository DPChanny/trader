from utils.env import get_admin_password
from utils.jwt import create_jwt_token, refresh_jwt_token, should_refresh_token
import logging

logger = logging.getLogger(__name__)


def verify_admin_password(password: str) -> bool:
    """Verify if the provided password matches the admin password"""
    return password == get_admin_password()


def generate_admin_token() -> str:
    """Generate a JWT token for admin authentication"""
    payload = {"role": "admin", "type": "admin_access"}
    return create_jwt_token(payload)


def refresh_admin_token(token: str) -> str:
    """Refresh an admin JWT token"""
    return refresh_jwt_token(token)


def check_should_refresh(token: str) -> bool:
    """Check if token should be refreshed"""
    return should_refresh_token(token)
