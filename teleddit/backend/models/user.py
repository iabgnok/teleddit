# models/user.py
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    
    # 权限相关字段
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    banned_until = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active, suspended, deleted
    
    created_at = Column(DateTime, server_default=func.now())

    # 关联关系
    posts = relationship("Post", back_populates="author", foreign_keys="[Post.author_id]")
    comments = relationship("Comment", back_populates="author", foreign_keys="[Comment.author_id]")
