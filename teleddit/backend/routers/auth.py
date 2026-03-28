# routers/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.user import RegisterRequest, LoginRequest, UserResponse
from crud.user import create_user, login_user, get_user_by_id
from crud.user import get_user_communities_crud
from config.database import get_db
from utils.auth import get_current_user
from crud.user import get_user_posts_crud

router = APIRouter(prefix="/auth", tags=["认证"])

@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    await create_user(db, body.email, body.username, body.password)
    return {"message": "注册成功"}

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_user(db, body.email, body.password)

@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    return await get_user_by_id(db, user_id)

@router.get("/me/communities")
async def get_my_communities(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_communities_crud(db, current_user.id)

@router.get("/users/{user_id}/communities")
async def get_user_communities(user_id: str, db: AsyncSession = Depends(get_db)):
    return await get_user_communities_crud(db, user_id)

@router.get("/users/{user_id}/posts")
async def get_user_posts(
    user_id: str,
    community_id: str = None, 
    sort: str = "new",
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    return await get_user_posts_crud(db, user_id, community_id, sort, limit, offset)