from datetime import datetime, timedelta, timezone
import logging

import jwt

from utils.env import get_jwt_secret

logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
JWT_REFRESH_THRESHOLD_HOURS = 6


def create_jwt_token(
    payload: dict, expiration_hours: int = JWT_EXPIRATION_HOURS
) -> str:
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(hours=expiration_hours)
    token_data = {
        **payload,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"verify_iat": False},
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        logger.warning(f"Token expired: {str(e)}")
        raise Exception("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {type(e).__name__}: {str(e)}")
        raise Exception("Invalid token")


def is_token_expired(token: str) -> bool:
    try:
        decode_jwt_token(token)
        return False
    except Exception as e:
        if "expired" in str(e).lower():
            return True
        raise


def should_refresh_token(token: str) -> bool:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": False},
        )
        exp_timestamp = payload.get("exp")
        if not exp_timestamp:
            return True

        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        time_remaining = exp_datetime - datetime.now(timezone.utc)

        return time_remaining < timedelta(hours=JWT_REFRESH_THRESHOLD_HOURS)
    except Exception:
        return True


def refresh_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": False},
        )

        payload.pop("exp", None)
        payload.pop("iat", None)

        return create_jwt_token(payload)
    except jwt.InvalidTokenError:
        raise Exception("Invalid token for refresh")
