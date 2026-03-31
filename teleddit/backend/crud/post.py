from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from models.post import Post, PostVote, PostTag, PostFavorite
from models.community import Community
from schemas.post import PostResponse, TagResponse
from fastapi import HTTPException
import uuid

async def create_post(db: AsyncSession, author_id: str, data: dict):
    # 检查社区是否存在
    result = await db.execute(select(Community).where(Community.id == data["community_id"]))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="社区不存在")

    post = Post(
        id=str(uuid.uuid4()),
        author_id=author_id,
        community_id=data["community_id"],
        title=data["title"],
        content=data.get("content", ""),
        content_type=data.get("content_type", "text"),
        cover_url=data.get("cover_url"),
        media_urls=data.get("media_urls"),
        link_url=data.get("link_url"),
        is_draft=data.get("is_draft", False),
    )
    db.add(post)
    await db.flush()

    if data.get("tag_ids"):
        from models.post import Tag
        valid_tags = await db.execute(select(Tag.id).where(Tag.id.in_(data["tag_ids"])))
        valid_tag_ids = valid_tags.scalars().all()
        for tag_id in valid_tag_ids:
            db.add(PostTag(post_id=post.id, tag_id=tag_id))

    await db.commit()
    await db.refresh(post)
    return post


async def get_posts(db: AsyncSession, current_user_id: str, community_id=None, saved_only=False, my_posts_only=False, sort="new", limit=20, offset=0):
    query = (
        select(Post)
        .join(Community, Post.community_id == Community.id)
        .options(
            selectinload(Post.author),
            selectinload(Post.community),
            selectinload(Post.tags),
            selectinload(Post.votes),
        )
        .where(Post.is_draft == False)
    )

    if saved_only and current_user_id:
        query = query.join(PostFavorite, PostFavorite.post_id == Post.id).where(PostFavorite.user_id == current_user_id)
    elif my_posts_only and current_user_id:
        query = query.where(Post.author_id == current_user_id)
    elif community_id:
        query = query.where(Post.community_id == community_id)
        
    if not saved_only and not my_posts_only:
        if not current_user_id:
            # 未登录用户只能看到非私密社区的帖子
            query = query.where(Community.visibility != "private")
        else:
            # 登录用户可以看到公开/受限社区，以及自己加入的私密社区
            from models.community import CommunityMember
            from sqlalchemy import or_
            query = query.outerjoin(
                CommunityMember, 
                (CommunityMember.community_id == Community.id) & (CommunityMember.user_id == current_user_id)
            ).where(
                or_(
                    Community.visibility != "private",
                    CommunityMember.user_id != None
                )
            )

    if sort == "top":
        query = query.order_by(Post.upvotes.desc())
    elif sort == "hot":
        query = query.order_by((Post.upvotes - Post.downvotes).desc())
    else:
        query = query.order_by(Post.created_at.desc())

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    posts = result.scalars().all()

    output = []
    for post in posts:
        user_vote = 0
        if current_user_id:
            user_vote = next(
                (v.vote_type for v in post.votes if v.user_id == current_user_id), 0
            )
        output.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "content_type": post.content_type,
            "cover_url": post.cover_url,
            "media_urls": post.media_urls,
            "link_url": post.link_url,
            "upvotes": post.upvotes,
            "downvotes": post.downvotes,
            "comment_count": post.comment_count,
            "is_draft": post.is_draft,
            "created_at": post.created_at,
            "author_id": post.author.id,
            "author": post.author.username,
            "author_avatar": post.author.avatar_url,
            "community_id": post.community.id,
            "community": post.community.name,
            "tags": [{"id": t.id, "name": t.name, "color": t.color} for t in post.tags],
            "user_voted": user_vote,
            "user_downvoted": user_vote == -1,
        })
    return output

async def vote_post(db: AsyncSession, user_id: str, post_id: str, vote_type: int):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    existing_vote_result = await db.execute(
        select(PostVote).where(PostVote.user_id == user_id, PostVote.post_id == post_id)
    )
    existing_vote = existing_vote_result.scalar_one_or_none()

    if existing_vote:
        if vote_type == 0:
            if existing_vote.vote_type == 1:
                post.upvotes -= 1
            else:
                post.downvotes -= 1
            await db.delete(existing_vote)
        elif existing_vote.vote_type != vote_type:
            if existing_vote.vote_type == 1:
                post.upvotes -= 1
                post.downvotes += 1
            else:
                post.downvotes -= 1
                post.upvotes += 1
            existing_vote.vote_type = vote_type
    else:
        if vote_type != 0:
            new_vote = PostVote(user_id=user_id, post_id=post_id, vote_type=vote_type)
            db.add(new_vote)
            if vote_type == 1:
                post.upvotes += 1
            elif vote_type == -1:
                post.downvotes += 1

    await db.commit()
    return {'message': 'Vote recorded'}

async def get_posts_content(db: AsyncSession, post_id: str, current_user_id: str):

    result = await db.execute(
        select(Post)
        .join(Community, Post.community_id == Community.id)
        .where(Post.id == post_id)
        .options(
            selectinload(Post.author),
            selectinload(Post.community),
            selectinload(Post.tags),
            selectinload(Post.votes),
        )
        .where(Post.is_draft == False)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
        
    if not current_user_id and post.community.visibility == "private":
        raise HTTPException(status_code=403, detail='Private community post')
    
    user_vote = 0
    if current_user_id:
        user_vote = next(
            (v.vote_type for v in post.votes if v.user_id == current_user_id), 0
        )

    response_data = PostResponse(
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
        author=post.author.username, # 数据库里是 post.author.username，Schema 里叫 author
        author_avatar=post.author.avatar_url,
        community_id=post.community.id,
        community=post.community.name, # 数据库里是 post.community.name，Schema 里叫 community
        tags=[TagResponse.model_validate(t) for t in post.tags],
        user_voted=user_vote,
        user_downvoted=(user_vote == -1)
    )
    return response_data


async def delete_post(db: AsyncSession, post_id: str, user_id: str):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    if post.author_id != user_id:
        raise HTTPException(status_code=403, detail='No permission to delete this post')
    
    community = await db.get(Community, post.community_id)
    if community:
        if community.posts_count is not None and community.posts_count > 0:
            community.posts_count -= 1
        else:
            community.posts_count = 0
            
    try:
        await db.delete(post)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="由于外键约束（如包含评论或互动），无法直接删除此帖子")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def toggle_favorite(db: AsyncSession, user_id: str, post_id: str):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')

    existing_favorite_result = await db.execute(
        select(PostFavorite).where(PostFavorite.user_id == user_id, PostFavorite.post_id == post_id)
    )
    existing_favorite = existing_favorite_result.scalar_one_or_none()

    try:
        if existing_favorite:
            await db.delete(existing_favorite)
            message = '取消收藏'
            status = "unfavorited"
        else:
            new_favorite = PostFavorite(user_id=user_id, post_id=post_id)
            db.add(new_favorite)
            message = '已收藏'
            status = "favorited"
        
        await db.commit()
    except IntegrityError:
        # 应对极高并发下的唯一约束冲突
        await db.rollback()
        # 此时可以递归调用一次 toggle 或直接返回当前真实状态
        return {"message": "操作冲突，请重试", "status": "error"}

    return {'message': message, 'status': status} # 返回具体状态更利于前端更新 UI