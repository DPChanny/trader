from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    message: str


class TokenRefreshResponse(BaseModel):
    token: str
    message: str
