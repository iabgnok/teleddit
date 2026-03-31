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
    # ?????????????
    result = await db.execute(
        select(User).where((User.email == email) | (User.username == username))
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="??????????")

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

    # ????????
    square_member = CommunityMember(
        user_id=new_user.id,
        community_id="square",
        role="member"
    )
    db.add(square_member)
    
    # ?????????
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
        raise HTTPException(status_code=401, detail="???????")

    if user.is_banned:
        raise HTTPException(status_code=403, detail="??????")

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
        raise HTTPException(status_code=404, detail="?????")
    return user # ???? SQLAlchemy ???? Pydantic ????

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
            name=m.community.name,
            avatar_url=m.community.avatar_url,
            member_count=m.community.member_count,
            last_activity_at=m.community.last_activity_at,
            created_at=m.community.created_at,
            role=m.role,
            is_pinned=m.is_pinned,
            is_muted=m.is_muted,
            is_archived=m.is_archived,
            joined_at=m.joined_at
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
        # ???????????????????????
        query = query.order_by((Post.upvotes - Post.downvotes).desc())
    else: # ?? new
        query = query.order_by(Post.created_at.desc())

    # 4. ?????
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    posts = result.scalars().all() # ???????? Post ???????
    output = []
    for post in posts:
        # ????????????????
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

async def update_user_crud(db: AsyncSession, user_id: str, new_username: str = None, new_password: str = None):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="?????")
    
    if new_username:
        # Check if username is taken by someone else
        result = await db.execute(select(User).where((User.username == new_username) & (User.id != user_id)))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="???????")
        user.username = new_username
        
    if new_password:
        user.password_hash = hash_password(new_password)
        
    await db.commit()
    await db.refresh(user)
    return user


