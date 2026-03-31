# models/post.py
from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"))
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)
    content_type = Column(String(20), default="text")
    cover_url = Column(String(500), nullable=True)
    media_urls = Column(JSON, nullable=True)
    link_url = Column(String(500), nullable=True)
    is_draft = Column(Boolean, default=False)
    
    # 权限相关字段
    is_deleted = Column(Boolean, default=False)
    deleted_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", back_populates="posts", foreign_keys=[author_id])
    community = relationship("Community", back_populates="posts")
    tags = relationship("Tag", secondary="post_tags", back_populates="posts")
    votes = relationship("PostVote", back_populates="post", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(36), primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(20), default="slate")

    posts = relationship("Post", secondary="post_tags", back_populates="tags")

class PostTag(Base):
    __tablename__ = "post_tags"

    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

class PostVote(Base):
    __tablename__ = "post_votes"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    vote_type = Column(Integer, nullable=False)

    post = relationship("Post", back_populates="votes")

class PostFavorite(Base):
    __tablename__ = "post_favorites"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

