# models/community.py
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE")) 
    member_count = Column(Integer, default=1)
    posts_count = Column(Integer, default=0)
    
    # 社区规则属性
    visibility = Column(String(20), default="public")  # public, restricted, private
    post_permission = Column(String(20), default="everyone")  # everyone, members_only
    comment_permission = Column(String(20), default="everyone")  # everyone, members_only
    join_mode = Column(String(20), default="open")  # open, apply, invite_only
    is_deleted = Column(Boolean, default=False)
    
    last_activity_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    # 关联关系
    creator = relationship("User")
    posts = relationship("Post", back_populates="community")
    members = relationship("CommunityMember", back_populates="community")       

class CommunityMember(Base):
    __tablename__ = "community_members"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(20), default="member")

    # 个人偏好设置
    is_pinned = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    last_read_at = Column(DateTime, server_default=func.now())

    joined_at = Column(DateTime, server_default=func.now())

    community = relationship("Community", back_populates="members")
    user = relationship("User")

class CommunityJoinRequest(Base):
    __tablename__ = "community_join_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    message = Column(String(500), nullable=True)
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    reviewed_at = Column(DateTime, nullable=True)

class CommunityBan(Base):
    __tablename__ = "community_bans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    banned_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
