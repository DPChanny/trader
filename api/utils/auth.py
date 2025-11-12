from fastapi import Header, HTTPException, Response

from utils.jwt import decode_jwt_token, should_refresh_token, refresh_jwt_token


async def verify_admin_token(
    authorization: str = Header(None), response: Response = None
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "")

    try:
        payload = decode_jwt_token(token)
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        # Check if token should be refreshed and add header if needed
        if response and should_refresh_token(token):
            try:
                new_token = refresh_jwt_token(token)
                response.headers["X-New-Token"] = new_token
            except Exception:
                pass  # If refresh fails, continue with existing token

        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
