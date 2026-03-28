# crud/user.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from models.community import CommunityMember, Community
from schemas.community import UserCommunityResponse
from schemas.user import UserResponse
from models.post import Post
from schemas.post import PostResponse, TagResponse
from sqlalchemy.orm import selectinload
from utils.auth import hash_password, verify_password, create_access_token
from fastapi import HTTPException
import uuid

async def create_user(db: AsyncSession, email: str, username: str, password: str) -> User:
    # 检查邮箱或用户名是否已存在
    result = await db.execute(
        select(User).where((User.email == email) | (User.username == username))
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="邮箱或用户名已被注册")

    new_user = User(
        id=str(uuid.uuid4()),
        email=email,
        username=username,
        password_hash=hash_password(password),
        is_admin=False,
        is_banned=False,
        status="active"
    )
    db.add(new_user)
    await db.flush()

    # 默认加入广场社区
    square_member = CommunityMember(
        user_id=new_user.id,
        community_id="square",
        role="member"
    )
    db.add(square_member)
    
    # 增加广场社区成员数
    square_community = await db.execute(select(Community).where(Community.id == "square"))
    square = square_community.scalar_one_or_none()
    if square:
        square.member_count += 1

    await db.commit()
    await db.refresh(new_user)
    return new_user

async def login_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if user.is_banned:
        raise HTTPException(status_code=403, detail="账号已被封禁")

    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "id": user.id,
        "is_admin": user.is_admin
    }

async def get_user_by_id(db: AsyncSession, user_id: str):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user # 直接返回 SQLAlchemy 对象，让 Pydantic 自动处理

async def get_user_communities_crud(db: AsyncSession, user_id: str):
    
    result = await db.execute(
        select(CommunityMember)
        .options(selectinload(CommunityMember.community))
        .where(CommunityMember.user_id == user_id)
    )
    membership = result.scalars().all()

    return [
        UserCommunityResponse(
            id=m.community.id,
            type="community",
            name=m.community.name,
            avatar_url=m.community.avatar_url,
            member_count=m.community.member_count,
            last_activity_at=m.community.last_activity_at,
            created_at=m.community.created_at,
            role=m.role,
            is_pinned=m.is_pinned,
            is_muted=m.is_muted,
            is_archived=m.is_archived,
            joined_at=m.joined_at,
            unread_count=0
        )
        for m in membership
    ]

async def get_user_posts_crud(
        db: AsyncSession, 
        user_id: str, 
        community_id: str = None, 
        sort: str = "new", 
        limit: int = 20, 
        offset: int = 0
    ):
    query = (
        select(Post)
        .options(
            selectinload(Post.community),
            selectinload(Post.author),
            selectinload(Post.votes),
            selectinload(Post.tags),
            
        )
        .where(Post.is_draft == False)
    )
    if community_id:
        query = query.where(Post.community_id == community_id)
    if sort == "top":
        query = query.order_by(Post.upvotes.desc())
    elif sort == "hot":
        # 简单的热度计算，实际项目中可能是按时间衰减公式
        query = query.order_by((Post.upvotes - Post.downvotes).desc())
    else: # 默认 new
        query = query.order_by(Post.created_at.desc())

    # 4. 分页并执行
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    posts = result.scalars().all() # 这里拿到的是一个 Post 模型对象的数组
    output = []
    for post in posts:
        # 寻找当前用户对这篇帖子的点赞状态
        user_vote = 0
        if user_id:
            user_vote = next(
                (v.vote_type for v in post.votes if v.user_id == user_id), 0
            )

        post_data = PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            content_type=post.content_type,
            cover_url=post.cover_url,
            media_urls=post.media_urls,
            link_url=post.link_url,
            upvotes=post.upvotes,
            downvotes=post.downvotes,
            comment_count=post.comment_count,
            is_draft=post.is_draft,
            created_at=post.created_at,
            author_id=post.author.id,
            author=post.author.username, 
            author_avatar=post.author.avatar_url,
            community_id=post.community.id,
            community=post.community.name,
            tags=[TagResponse.model_validate(t) for t in post.tags],
            user_voted=user_vote,
            user_downvoted=(user_vote == -1),
            
        )
        output.append(post_data)

    return output

