# routers/posts.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from schemas.post import CreatePostRequest, PostVoteRequest, PostResponse
from crud.post import create_post, get_posts, delete_post
from config.database import get_db
from utils.auth import get_current_user, require_post_owner, get_optional_user
from models.post import Post

router = APIRouter(prefix="/posts", tags=["帖子"])

@router.post("")
async def new_post(body: CreatePostRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await create_post(db, current_user.id, body.model_dump())

@router.get("")
async def list_posts(
    community_id: Optional[str] = None,
    saved_only: bool = False,
    my_posts_only: bool = False,
    sort: str = "new",
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user_id = current_user.id if current_user else None
    return await get_posts(db, user_id, community_id, saved_only, my_posts_only, sort, limit, offset)

from pydantic import BaseModel

class LinkPreviewRequest(BaseModel):
    url: str

@router.post("/link-preview")
async def link_preview(body: LinkPreviewRequest):
    # TODO: 实际实现应使用 aiohttp 或 requests 获取网页 meta 标签
    return {
        "title": "Link Preview",
        "description": "Preview description for " + body.url,
        "image": "",
        "domain": body.url.split("/")[2] if "//" in body.url else body.url
    }

@router.post('/{post_id}/vote')
async def vote_on_post(
    post_id: str,
    body: PostVoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from crud.post import vote_post
    return await vote_post(db, current_user.id, post_id, body.vote_type)


@router.get('/{post_id}', response_model=PostResponse)
async def get_single_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    from crud.post import get_posts_content
    user_id = current_user.id if current_user else None
    return await get_posts_content(db, post_id, user_id)


@router.delete('/{post_id}')
async def delete_single_post(
    post: Post = Depends(require_post_owner),
    db: AsyncSession = Depends(get_db)
):
    # require_post_owner 已经做了权限检查
    # 我们只需要调用 crud 删除逻辑即可
    # 为了复用 crud 里的逻辑，我们可以 pass user_id (虽然 redundant) 或者重构 crud
    # 这里直接调用 crud.delete_post，注意 crud 里可能还会查一次，稍显多余但安全
    await delete_post(db, post.id, post.author_id)
    return {"message": "帖子已删除"}


@router.post('/{post_id}/favorite')
async def favorite_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from crud.post import toggle_favorite
    return await toggle_favorite(db, current_user.id, post_id)
