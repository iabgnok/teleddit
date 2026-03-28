from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class Folder(Base):
    __tablename__ = "folders"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), nullable=False)
    emoji = Column(String(20), nullable=True)
    color = Column(String(20), nullable=True)

    # 包含的社区ID列表
    space_ids = Column(JSON, default=[])
    pinned_space_ids = Column(JSON, default=[])

    # 自动包含/排除规则
    auto_include = Column(JSON, default=[])
    auto_exclude = Column(JSON, default=[])

    order = Column(Integer, default=0)
    is_system = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="folders")
