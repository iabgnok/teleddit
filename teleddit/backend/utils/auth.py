# utils/auth.py
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from config.database import get_db
import os
from models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)
ACCESS_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str) -> str:
    # 确保 SECRET_KEY 存在
    secret_key = os.getenv("SECRET_KEY", "default_secret_key_please_change")
    to_encode = {"sub": user_id}
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

# ============== 1. 第一层：角色/身份验证 ==============

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    secret_key = os.getenv("SECRET_KEY", "default_secret_key_please_change")
    
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="无效的凭证")
    except JWTError:
        raise HTTPException(status_code=401, detail="凭证过期或无效")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
        
    if user.is_banned:
        # 如果被封禁，抛出 403
        raise HTTPException(status_code=403, detail="账号已被封禁")

    return user

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    
    try:
        # 复用 get_current_user 的逻辑，但捕获异常返回 None
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user

# ============== 2. 第二层：资源归属检测 ==============

# 延迟导入以避免循环引用
# from models.post import Post
# from models.comment import Comment

from models.post import Post
from models.comment import Comment

async def get_post_or_404(post_id: str, db: AsyncSession = Depends(get_db)) -> Post:
    result = await db.execute(select(Post).where(and_(Post.id == post_id, Post.is_deleted == False)))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    return post

async def require_post_owner(
    post: Post = Depends(get_post_or_404),
    user: User = Depends(get_current_user)
) -> Post:
    # 平台管理员可以绕过归属检查
    if user.is_admin:
        return post
        
    if post.author_id != user.id:
        raise HTTPException(status_code=403, detail="没有操作权限")
    return post

async def get_comment_or_404(comment_id: str, db: AsyncSession = Depends(get_db)) -> Comment:
    result = await db.execute(select(Comment).where(and_(Comment.id == comment_id, Comment.is_deleted == False)))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    return comment

async def require_comment_owner(
    comment: Comment = Depends(get_comment_or_404),
    user: User = Depends(get_current_user)
) -> Comment:
    if user.is_admin:
        return comment
    if comment.author_id != user.id:
        raise HTTPException(status_code=403, detail="没有操作权限")
    return comment

# ============== 3. 第三层：社区规则检测 ==============
from models.community import Community, CommunityMember

async def get_community_or_404(community_id: str, db: AsyncSession = Depends(get_db)) -> Community:
    result = await db.execute(select(Community).where(and_(Community.id == community_id, Community.is_deleted == False)))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="社区不存在")
    return community

async def _get_member_record(community_id: str, user_id: str, db: AsyncSession) -> Optional[CommunityMember]:
    result = await db.execute(
        select(CommunityMember).where(
            and_(CommunityMember.community_id == community_id, CommunityMember.user_id == user_id)
        )
    )
    return result.scalar_one_or_none()

async def check_community_visibility(
    community: Community = Depends(get_community_or_404),
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
) -> Community:
    # 公开社区：所有人可读
    if community.visibility == "public":
        return community
        
    # 受限/私密社区：只有成员可读（或者受限社区允许可读？）
    # 假设：public=所有可读, restricted=所有可读(通过user判断是否能发), private=仅成员可见
    if community.visibility == "restricted":
        return community

    if community.visibility == "private":
        if not user:
            # 未登录，不可见（且报404）
            raise HTTPException(status_code=404, detail="社区不存在")
            
        # 平台管理员可见
        if user.is_admin:
            return community
            
        member = await _get_member_record(community.id, user.id, db)
        if not member:
            raise HTTPException(status_code=404, detail="社区不存在") # 隐形这
            
    return community

async def get_community_role(
    community: Community = Depends(get_community_or_404),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> str:
    # 返回 "owner" | "moderator" | "member" | "none"
    if user.is_admin:
        return "owner" # 管理员赋予最高权限

    member = await _get_member_record(community.id, user.id, db)
    if not member:
        return "none"
    return member.role

async def require_moderator(
    role: str = Depends(get_community_role)
) -> str:
    if role not in ["moderator", "owner"]:
        raise HTTPException(status_code=403, detail="需要版主权限")
    return role

async def require_community_member(
    role: str = Depends(get_community_role)
) -> str:
    if role == "none":
        raise HTTPException(status_code=403, detail="需要加入社区才能操作")
    return role