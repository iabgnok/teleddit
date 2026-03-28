import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.folder import Folder
from schemas.folder import FolderCreate, FolderUpdate

async def get_user_folders(db: AsyncSession, user_id: str):
    result = await db.execute(select(Folder).filter(Folder.user_id == user_id).order_by(Folder.order))
    return result.scalars().all()

async def create_folder(db: AsyncSession, user_id: str, folder_data: FolderCreate):
    new_folder = Folder(
        id=str(uuid.uuid4()),
        user_id=user_id,
        label=folder_data.label,
        emoji=folder_data.emoji,
        color=folder_data.color,
        space_ids=folder_data.space_ids,
        pinned_space_ids=folder_data.pinned_space_ids,
        auto_include=folder_data.auto_include,
        auto_exclude=folder_data.auto_exclude,
        order=folder_data.order,
        is_system=False
    )
    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)
    return new_folder

async def update_folder(db: AsyncSession, user_id: str, folder_id: str, folder_data: FolderUpdate):
    result = await db.execute(select(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id))
    folder = result.scalar_one_or_none()
    
    if folder:
        update_data = folder_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(folder, key, value)
        await db.commit()
        await db.refresh(folder)
    return folder

async def delete_folder(db: AsyncSession, user_id: str, folder_id: str):
    result = await db.execute(select(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id))
    folder = result.scalar_one_or_none()
    if folder:
        await db.delete(folder)
        await db.commit()
        return True
    return False

async def reorder_folders(db: AsyncSession, user_id: str, folder_orders: list):
    # folder_orders is a list of dicts: [{"id": "...", "order": 0}, ...]
    # For a real robust implementation we might do an upsert or multiple updates
    for item in folder_orders:
        result = await db.execute(select(Folder).filter(Folder.id == item["id"], Folder.user_id == user_id))
        folder = result.scalar_one_or_none()
        if folder:
            folder.order = item["order"]
    await db.commit()
    return True
