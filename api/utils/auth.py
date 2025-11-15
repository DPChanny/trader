from fastapi import Header, HTTPException, Response
import logging

from utils.jwt import decode_jwt_token, should_refresh_token, refresh_jwt_token

logger = logging.getLogger(__name__)


async def verify_admin_token(
    authorization: str = Header(None), response: Response = None
) -> dict:
    if not authorization:
        logger.warning("Missing auth header")
        raise HTTPException(
            status_code=401, detail="Authorization header missing"
        )

    if not authorization.startswith("Bearer "):
        logger.warning(f"Invalid format: {authorization[:20]}...")
        raise HTTPException(
            status_code=401, detail="Invalid authorization format"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = decode_jwt_token(token)
        if payload.get("role") != "admin":
            logger.warning(f"Non-admin attempt: {payload.get('role')}")
            raise HTTPException(status_code=403, detail="Admin access required")

        if response and should_refresh_token(token):
            try:
                new_token = refresh_jwt_token(token)
                response.headers["X-New-Token"] = new_token
            except Exception:
                pass

        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
