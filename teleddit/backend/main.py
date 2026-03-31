from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from config.database import engine, Base, AsyncSessionLocal
from sqlalchemy import select
import models.user
import models.community
import models.post
import models.comment
import models.folder
from routers import auth, posts, communities, comments, folders, upload
import os

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建数据库表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 自动创建默认广场社区
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(models.community.Community).where(models.community.Community.id == "square"))
        if not result.scalar_one_or_none():
            square = models.community.Community(
                id="square",
                name="广场",
                description="默认的公共交流区",
                creator_id=None
            )
            session.add(square)
            await session.commit()
    yield

app = FastAPI(title="Teleddit API", lifespan=lifespan)

# 挂载静态文件目录，用于访问上传的图片
# 比如上传后返回的 URL 是 /static/xxx.jpg，就可以通过 http://localhost:8000/static/xxx.jpg 访问
UPLOADS_DIR = "uploads"
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)
app.mount("/static", StaticFiles(directory=UPLOADS_DIR), name="static")

# 允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(communities.router)
app.include_router(comments.router)
app.include_router(folders.router)
app.include_router(upload.router)
