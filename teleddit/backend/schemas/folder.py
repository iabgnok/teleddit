from pydantic import BaseModel, Field
from schemas.core import CamelModel
from typing import List, Optional

class FolderBase(CamelModel):
    label: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    space_ids: List[str] = Field(default_factory=list)
    pinned_space_ids: List[str] = Field(default_factory=list)
    auto_include: List[str] = Field(default_factory=list)
    auto_exclude: List[str] = Field(default_factory=list)
    order: int = 0

class FolderCreate(FolderBase):
    pass

class FolderUpdate(CamelModel):
    label: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    space_ids: Optional[List[str]] = None
    pinned_space_ids: Optional[List[str]] = None
    auto_include: Optional[List[str]] = None
    auto_exclude: Optional[List[str]] = None
    order: Optional[int] = None

class FolderResponse(FolderBase):
    id: str
    is_system: bool

class FolderOrderUpdate(CamelModel):
    id: str
    order: int

class FolderReorderRequest(CamelModel):
    folders: List[FolderOrderUpdate]
