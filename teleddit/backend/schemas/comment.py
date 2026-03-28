# schemas/comment.py
from pydantic import BaseModel
from schemas.core import CamelModel
from typing import Optional, List
from datetime import datetime

class CreateCommentRequest(CamelModel):
    content: str
    parent_id: Optional[str] = None

class CommentResponse(CamelModel):
    id: str
    content: str
    is_deleted: bool = False
    author_id: str
    author: str
    author_avatar: Optional[str] = None
    upvotes: int
    downvotes: int
    created_at: datetime
    user_voted: int = 0
    children: List["CommentResponse"] = []

CommentResponse.model_rebuild()