from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from config.database import get_db
from utils.auth import get_current_user, require_comment_owner, get_optional_user
from crud.comment import create_comment, get_comments, vote_comment, delete_comment
from schemas.comment import CreateCommentRequest, CommentResponse, VoteCommentRequest
from models.comment import Comment

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["评论"])

@router.post("", response_model=CommentResponse)
async def add_comment(
    post_id: str,
    body: CreateCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """添加评论"""
    comment = await create_comment(
        db=db,
        post_id=post_id,
        author_id=current_user.id,
        content=body.content,
        parent_id=body.parent_id
    )
    return {
        "id": comment.id,
        "content": comment.content,
        "author_id": comment.author_id,
        "author": current_user.username,
        "author_avatar": current_user.avatar_url,
        "upvotes": comment.upvotes,
        "downvotes": comment.downvotes,
        "created_at": comment.created_at,
        "user_voted": 0,
        "children": []
    }

@router.get("", response_model=List[CommentResponse])
async def fetch_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """获取某帖子下的所有评论"""
    return await get_comments(
        db=db,
        post_id=post_id,
        current_user_id=current_user.id if current_user else None
    )

@router.post("/{comment_id}/vote")
async def vote_on_comment(
    post_id: str,
    comment_id: str,
    body: VoteCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """缁欒瘎璁虹偣璧?鐐硅俯"""
    return await vote_comment(
        db=db,
        comment_id=comment_id,
        user_id=current_user.id,
        vote_type=body.vote_type
    )

@router.delete("/{comment_id}")
async def remove_comment(
    comment: Comment = Depends(require_comment_owner),
    db: AsyncSession = Depends(get_db)
):
    """删除评论"""
    # 同样逻辑，通过 dependency 验证所有权
    return await delete_comment(
        db=db,
        comment_id=comment.id,
        current_user_id=comment.author_id
    )
