# schemas/community.py
from pydantic import BaseModel
from schemas.core import CamelModel
from typing import Optional
from datetime import datetime

class CreateCommunityRequest(CamelModel):
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    visibility: str = "public"
    post_permission: str = "everyone"
    comment_permission: str = "everyone"
    join_mode: str = "open"

class CommunityResponse(CamelModel):
    id: str
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    member_count: int
    visibility: str
    post_permission: str
    comment_permission: str
    join_mode: str
    is_deleted: bool = False
    
    last_activity_at: datetime
    created_at: datetime
    unread_count: int = 0

class JoinRequestCreate(CamelModel):
    message: Optional[str] = None

class JoinRequestResponse(CamelModel):
    id: int
    community_id: str
    user_id: str
    status: str
    message: Optional[str] = None
    created_at: datetime
    
class UpdateMemberPreferenceRequest(CamelModel):
    is_pinned: Optional[bool] = None
    is_muted: Optional[bool] = None
    is_archived: Optional[bool] = None

class UserCommunityResponse(CamelModel):
    id: str
    type: str = "community"
    name: str
    avatar_url: Optional[str] = None
    member_count: int
    last_activity_at: datetime
    created_at: datetime
    role: str
    is_pinned: bool
    is_muted: bool
    is_archived: bool
    joined_at: datetime
    unread_count: int = 0
