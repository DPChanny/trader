from fastapi import APIRouter, HTTPException, Header

from dtos.admin_dto import (
    AdminLoginRequest,
    AdminLoginResponse,
    TokenRefreshResponse,
)
from services.admin_service import (
    verify_admin_password,
    generate_admin_token,
    refresh_admin_token,
)

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    if not verify_admin_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid admin password")

    token = generate_admin_token()
    return AdminLoginResponse(token=token, message="Login successful")


@admin_router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "")

    try:
        new_token = refresh_admin_token(token)
        return TokenRefreshResponse(
            token=new_token, message="Token refreshed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
