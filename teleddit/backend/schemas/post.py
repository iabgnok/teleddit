# schemas/post.py
from pydantic import BaseModel
from schemas.core import CamelModel
from typing import Optional, List
from datetime import datetime

class CreatePostRequest(CamelModel):
    title: str
    content: str = ""
    content_type: str = "text"
    community_id: str
    cover_url: Optional[str] = None
    media_urls: Optional[List[str]] = None
    link_url: Optional[str] = None
    tag_ids: Optional[List[str]] = []
    is_draft: bool = False

class TagResponse(CamelModel):
    id: str
    name: str
    color: str

class PostResponse(CamelModel):
    id: str
    title: str
    content: Optional[str] = None
    content_type: str
    cover_url: Optional[str] = None
    media_urls: Optional[List[str]] = None
    link_url: Optional[str] = None
    upvotes: int
    downvotes: int
    comment_count: int
    is_draft: bool
    is_deleted: bool = False # 增加软删除
    is_pinned: bool = False # 增加置顶
    created_at: datetime
    author_id: str
    author: str
    author_avatar: Optional[str] = None
    community_id: str
    community: str
    tags: List[TagResponse] = []
    user_voted: int = 0
    user_downvoted: bool = False

class PostVoteRequest(CamelModel):
    vote_type: int # 1 for upvote, -1 for downvote, 0 to revoke


