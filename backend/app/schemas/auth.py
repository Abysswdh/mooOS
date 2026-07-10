"""Auth schemas — login request/response, token payload."""

from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int  # user id
    email: str
    role: str
    exp: int
