# schemas/user.py
from pydantic import BaseModel, EmailStr
from schemas.core import CamelModel
from typing import Optional
from datetime import datetime

class RegisterRequest(CamelModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(CamelModel):
    email: EmailStr
    password: str

class UserResponse(CamelModel):
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    
    # 权限字段
    is_admin: bool = False
    is_banned: bool = False
    status: str = "active"

    created_at: datetime

