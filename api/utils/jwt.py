from datetime import datetime, timedelta

import jwt

from utils.env import get_jwt_secret

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
JWT_REFRESH_THRESHOLD_HOURS = 6


def create_jwt_token(
    payload: dict, expiration_hours: int = JWT_EXPIRATION_HOURS
) -> str:
    expiration = datetime.now() + timedelta(hours=expiration_hours)
    token_data = {**payload, "exp": expiration, "iat": datetime.now()}
    return jwt.encode(token_data, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, get_jwt_secret(), algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
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

        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        time_remaining = exp_datetime - datetime.now()

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
