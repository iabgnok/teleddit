# crud/comment.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from models.comment import Comment, CommentVote
from models.post import Post
from fastapi import HTTPException
import uuid
from typing import Optional

async def create_comment(
    db: AsyncSession,
    post_id: str,
    author_id: str,
    content: str,
    parent_id: Optional[str] = None
):
    # 检查帖子是否存在
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    # 如果是回复，检查父评论是否存在
    # 忽略 Swagger 默认生成的 "string" 或空字符串以及字面量 "null"
    if parent_id in ("string", "", "null"):
        parent_id = None
        
    if parent_id:
        parent = await db.get(Comment, parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="父评论不存在")

    comment = Comment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        author_id=author_id,
        content=content,
        parent_id=parent_id,
    )
    db.add(comment)

    # 更新帖子评论数
    await db.execute(
    update(Post)
    .where(Post.id == post_id)
    .values(comment_count=Post.comment_count + 1)
)
    await db.commit()
    await db.refresh(comment)
    return comment

async def get_comments(db: AsyncSession, post_id: str, current_user_id: str):
    # 一次性拿到该帖子所有评论，包括作者信息
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.votes)

        )
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )
    flat_comments = result.scalars().all()

    # 整理成带 user_voted 的字典
    comment_map = {}
    for c in flat_comments:
        user_vote = next(
            (v.vote_type for v in c.votes if v.user_id == current_user_id), 0
        )
        comment_map[c.id] = {
            "id": c.id,
            "content": c.content,
            "author_id": c.author_id,
            "author": c.author.username,
            "author_avatar": c.author.avatar_url,
            "upvotes": c.upvotes,
            "downvotes": c.downvotes,
            "created_at": c.created_at,
            "parent_id": c.parent_id,
            "user_voted": user_vote,
            "children": [],
        }

    # 扁平列表转树形结构
    tree = []
    for comment in comment_map.values():
        parent_id = comment.pop("parent_id")
        if parent_id and parent_id in comment_map:
            comment_map[parent_id]["children"].append(comment)
        else:
            tree.append(comment)

    return tree

async def vote_comment(
    db: AsyncSession,
    comment_id: str,
    user_id: str,
    vote_type: int
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")

    result = await db.execute(
        select(CommentVote).where(
            CommentVote.comment_id == comment_id,
            CommentVote.user_id == user_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.vote_type == vote_type:
            # 相同投票再点一次 → 取消
            if vote_type == 1:
                comment.upvotes -= 1
            else:
                comment.downvotes -= 1
            await db.delete(existing)
        else:
            # 切换投票方向
            if vote_type == 1:
                comment.upvotes += 1
                comment.downvotes -= 1
            else:
                comment.upvotes -= 1
                comment.downvotes += 1
            existing.vote_type = vote_type
    else:
        # 新投票
        db.add(CommentVote(
            comment_id=comment_id,
            user_id=user_id,
            vote_type=vote_type
        ))
        if vote_type == 1:
            comment.upvotes += 1
        else:
            comment.downvotes += 1

    await db.commit()
    return {"upvotes": comment.upvotes, "downvotes": comment.downvotes}

async def delete_comment(db: AsyncSession, comment_id: str, current_user_id: str):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")

    # 只有评论作者可以删除
    if comment.author_id != current_user_id:
        raise HTTPException(status_code=403, detail="无权删除此评论")

    # 评论数减一
    post = await db.get(Post, comment.post_id)
    if post:
        post.comment_count = max(0, post.comment_count - 1)

    try:
        await db.delete(comment)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="删除失败或由于父子级联报错")

    return {"message": "删除成功"}