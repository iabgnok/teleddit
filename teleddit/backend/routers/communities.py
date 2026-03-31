# routers/communities.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from schemas.community import CreateCommunityRequest, CommunityResponse, UpdateMemberPreferenceRequest, UpdateCommunitySettingsRequest
from crud.community import (
    get_communities, 
    get_community, 
    create_community, 
    join_community, 
    leave_community, 
    update_member_preferences,
    get_community_requests,
    handle_join_request,
    ban_user_from_community,
    update_community
)
from utils.auth import get_current_user, get_optional_user, require_moderator, require_community_member
from typing import List

router = APIRouter(prefix="/communities", tags=["社区"])

@router.get("", response_model=List[CommunityResponse])
async def list_communities(db: AsyncSession = Depends(get_db)):
    return await get_communities(db)

@router.get("/{community_id}", response_model=CommunityResponse)
async def retrieve_community(
    community_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_optional_user)
):
    user_id = current_user.id if current_user else None
    return await get_community(db, community_id, user_id)

@router.post("")
async def new_community(body: CreateCommunityRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await create_community(
        db, body.name, body.description, body.avatar_url, current_user.id,
        body.visibility, body.post_permission, body.comment_permission, body.join_mode
    )

@router.post("/{community_id}/join")
async def join(
    community_id: str, 
    message: str = "", 
    db: AsyncSession = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    result = await join_community(db, current_user.id, community_id, message)
    return result

@router.delete("/{community_id}/join")
async def leave(community_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await leave_community(db, current_user.id, community_id)
    return {"message": "已退出社区"}

@router.patch("/{community_id}/preferences")
async def update_preferences(community_id: str, body: UpdateMemberPreferenceRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await update_member_preferences(db, current_user.id, community_id, body.is_pinned, body.is_muted, body.is_archived)
    return {"message": "偏好设置已更新"}

@router.patch("/{community_id}/admin/settings", response_model=CommunityResponse)
async def update_community_settings(
    community_id: str,
    body: UpdateCommunitySettingsRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    role: str = Depends(require_moderator)
):
    return await update_community(db, community_id, body.dict(exclude_unset=True), current_user.id)


# --- 版主管理接口 ---

@router.get("/{community_id}/requests")
async def list_requests(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    role: str = Depends(require_moderator)
):
    return await get_community_requests(db, community_id)

@router.post("/{community_id}/requests/{request_id}/approve")
async def approve_request(
    community_id: str,
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    role: str = Depends(require_moderator)
):
    return await handle_join_request(db, request_id, "approve", current_user.id)

@router.post("/{community_id}/requests/{request_id}/reject")
async def reject_request(
    community_id: str,
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    role: str = Depends(require_moderator)
):
    return await handle_join_request(db, request_id, "reject", current_user.id)

@router.post("/{community_id}/ban")
async def ban_user(
    community_id: str,
    user_id: str,
    reason: str = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    role: str = Depends(require_moderator)
):
    return await ban_user_from_community(db, community_id, user_id, current_user.id, reason)
