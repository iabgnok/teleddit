from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderReorderRequest
from crud.folder import get_user_folders, create_folder, update_folder, delete_folder, reorder_folders
from config.database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["Folders"])

@router.get("", response_model=List[FolderResponse])
async def list_folders(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """获取用户所有文件夹"""
    return await get_user_folders(db, current_user.id)

@router.post("", response_model=FolderResponse)
async def new_folder(
    body: FolderCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """创建新文件夹"""
    return await create_folder(db, current_user.id, body)

@router.patch("/{folder_id}", response_model=FolderResponse)
async def modify_folder(
    folder_id: str,
    body: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """修改文件夹(重命名, 改图标, 改社区等)"""
    folder = await update_folder(db, current_user.id, folder_id, body)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在或无权修改")
    return folder

@router.delete("/{folder_id}")
async def remove_folder(
    folder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """删除文件夹"""
    success = await delete_folder(db, current_user.id, folder_id)
    if not success:
        raise HTTPException(status_code=404, detail="文件夹不存在或无权删除")
    return {"message": "删除成功"}

@router.post("/reorder")
async def reorder(
    body: FolderReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """调整文件夹排序"""
    await reorder_folders(db, current_user.id, [item.model_dump() for item in body.folders])
    return {"message": "排序已更新"}
