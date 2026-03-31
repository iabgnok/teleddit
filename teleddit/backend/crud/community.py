# crud/community.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, exists
from models.community import Community, CommunityMember, CommunityJoinRequest, CommunityBan
from fastapi import HTTPException
import uuid
from datetime import datetime

async def get_communities(db: AsyncSession):
    result = await db.execute(
        select(Community).order_by(Community.last_activity_at.desc())
    )
    return result.scalars().all()

async def get_community(db: AsyncSession, community_id: str, current_user_id: str = None):
    result = await db.execute(
        select(Community).where(Community.id == community_id)
    )
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="社区不存在")

    my_role = None
    if current_user_id:
        member = await db.execute(
            select(CommunityMember).where(
                and_(CommunityMember.user_id == current_user_id, CommunityMember.community_id == community_id)
            )
        )
        mbr = member.scalar_one_or_none()
        if mbr:
            my_role = mbr.role

    # You can attach it to the instance dynamically, or just wrap it in a dict.
    # The simplest is setattr or building a Pydantic dict
    setattr(community, "my_role", my_role)
    
    return community

async def create_community(
    db: AsyncSession, 
    name: str, 
    description: str, 
    avatar_url: str, 
    creator_id: str,
    visibility: str = "public",
    post_permission: str = "everyone",
    comment_permission: str = "everyone",
    join_mode: str = "open"
):
    # 检查名称是否重复
    result = await db.execute(select(Community).where(Community.name == name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="社区名已存在")

    community_id = str(uuid.uuid4())
    community = Community(
        id=community_id,
        name=name,
        description=description,
        avatar_url=avatar_url,
        creator_id=creator_id,
        visibility=visibility,
        post_permission=post_permission,
        comment_permission=comment_permission,
        join_mode=join_mode
    )
    db.add(community)

    # 创作者自动成为 owner
    member = CommunityMember(
        user_id=creator_id,
        community_id=community_id,
        role="owner"
    )
    db.add(member)
    await db.commit()
    return community

async def join_community(db: AsyncSession, user_id: str, community_id: str, message: str = ""):
    # 1. 检查社区是否存在
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="社区不存在")

    # 2. 检查是否被封禁
    result = await db.execute(select(CommunityBan).where(
        and_(CommunityBan.user_id == user_id, CommunityBan.community_id == community_id)
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="你已被该社区封禁")

    # 3. 检查是否已加入
    result = await db.execute(select(CommunityMember).where(
        and_(CommunityMember.user_id == user_id, CommunityMember.community_id == community_id)
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="你已经是该社区成员")

    # 4. 根据 join_mode 处理
    if community.join_mode == "open":
        # 开放加入模式：直接成为成员
        member = CommunityMember(user_id=user_id, community_id=community_id, role="member")
        db.add(member)
        community.member_count += 1
        await db.commit()
        return {"status": "joined", "message": "加入成功"}

    elif community.join_mode == "apply":
        # 申请模式：创建申请记录
        # 检查是否已有待定申请
        result = await db.execute(select(CommunityJoinRequest).where(
            and_(
                CommunityJoinRequest.user_id == user_id, 
                CommunityJoinRequest.community_id == community_id,
                CommunityJoinRequest.status == "pending"
            )
        ))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="已有待处理的申请")

        request = CommunityJoinRequest(
            user_id=user_id,
            community_id=community_id,
            request_message=message,
            status="pending"
        )
        db.add(request)
        await db.commit()
        return {"status": "pending", "message": "申请已提交，请等待审核"}

    else:
        # 其他模式（如 invite_only），暂不支持自助加入
        raise HTTPException(status_code=403, detail="该社区不允许自助加入")

async def get_community_requests(db: AsyncSession, community_id: str):
    result = await db.execute(
        select(CommunityJoinRequest).where(
            and_(CommunityJoinRequest.community_id == community_id, CommunityJoinRequest.status == "pending")
        )
    )
    return result.scalars().all()

async def handle_join_request(db: AsyncSession, request_id: int, action: str, moderator_id: str):
    # action: "approve" or "reject"
    result = await db.execute(select(CommunityJoinRequest).where(CommunityJoinRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="该申请已被处理")

    request.reviewed_by = moderator_id
    request.reviewed_at = datetime.utcnow()
    
    if action == "approve":
        request.status = "approved"
        # 添加为成员
        member = CommunityMember(
            user_id=request.user_id, 
            community_id=request.community_id, 
            role="member"
        )
        db.add(member)
        # 更新人数
        community = await db.get(Community, request.community_id)
        community.member_count += 1
    else:
        request.status = "rejected"
        
    await db.commit()
    return {"status": request.status}

async def ban_user_from_community(db: AsyncSession, community_id: str, user_id: str, moderator_id: str, reason: str = None):
    # 检查是否为创建者（创建者不能被封禁）
    # 这里应该有逻辑检查目标用户的角色，不过简单起见，先检查是否是 owner
    result = await db.execute(select(CommunityMember).where(
        and_(CommunityMember.user_id == user_id, CommunityMember.community_id == community_id)
    ))
    member = result.scalar_one_or_none()
    
    if member and member.role == "owner":
        raise HTTPException(status_code=400, detail="不能封禁社区创建者")

    # 添加封禁记录
    ban = CommunityBan(
        community_id=community_id,
        user_id=user_id,
        banned_by=moderator_id,
        reason=reason
    )
    db.add(ban)

    # 如果是成员，踢出社区
    if member:
        await db.delete(member)
        community = await db.get(Community, community_id)
        community.member_count -= 1

    await db.commit()
    return {"message": "用户已被封禁"}

async def leave_community(db: AsyncSession, user_id: str, community_id: str):
    result = await db.execute(
        select(CommunityMember).where(
            and_(
                CommunityMember.user_id == user_id,
                CommunityMember.community_id == community_id
            )
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(status_code=400, detail="你还没有加入该社区")
    if membership.role == "owner":
        raise HTTPException(status_code=400, detail="创建者不能退出社区")

    await db.delete(membership)
    community = await db.get(Community, community_id)
    community.member_count -= 1
    await db.commit()

async def update_member_preferences(db: AsyncSession, user_id: str, community_id: str, is_pinned: bool = None, is_muted: bool = None, is_archived: bool = None):
    result = await db.execute(select(CommunityMember).where(
        and_(
            CommunityMember.user_id == user_id, 
            CommunityMember.community_id == community_id
        )
    ))
    membership = result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(status_code=404, detail="未加入社区")
        
    if is_pinned is not None: membership.is_pinned = is_pinned
    if is_muted is not None: membership.is_muted = is_muted
    if is_archived is not None: membership.is_archived = is_archived
    
    await db.commit()
    return membership

async def update_community(db: AsyncSession, community_id: str, update_data: dict, current_user_id: str = None):
    community = await get_community(db, community_id, current_user_id)
    
    # 动态更新字段
    for key, value in update_data.items():
        # 如果是可选字段或者是普通字符串，并且值不是 None 才覆盖
        if value is not None and hasattr(community, key):
            setattr(community, key, value)
            
    await db.commit()
    await db.refresh(community)
    
    # 因为 get_community 给 community 加上了 my_role，refresh 后可能会丢，我们要补上
    if current_user_id:
        member = await db.execute(
            select(CommunityMember).where(
                and_(CommunityMember.user_id == current_user_id, CommunityMember.community_id == community_id)
            )
        )
        mbr = member.scalar_one_or_none()
        setattr(community, "my_role", mbr.role if mbr else None)
        
    return community
