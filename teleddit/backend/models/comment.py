# models/comment.py
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"))
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    parent_id = Column(String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    
    # 权限相关字段
    is_deleted = Column(Boolean, default=False)
    deleted_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", back_populates="comments", foreign_keys=[author_id])
    post = relationship("Post")
    children = relationship("Comment", back_populates="parent")
    parent = relationship("Comment", back_populates="children", remote_side=[id])
    votes = relationship("CommentVote", back_populates="comment", cascade="all, delete-orphan")

class CommentVote(Base):
    __tablename__ = "comment_votes"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    comment_id = Column(String(36), ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True)
    vote_type = Column(Integer, nullable=False)

    comment = relationship("Comment", back_populates="votes")