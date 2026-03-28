# config/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Explicitly load .env from the backend root if not found automatically
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

DATABASE_URL = (
    f"mysql+aiomysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    pool_size=10,               # 连接池中保持的连接数
    max_overflow=20,            # 超过 pool_size 后最多可以创建的连接数
    pool_recycle=3600,          # 连接重置周期（秒），防止 MySQL 连接超时断开
    pool_pre_ping=True          # 每次从池中获取连接时探测其连通性
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

# 依赖注入用的 get_db
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session