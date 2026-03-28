from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3
import os
import uuid
from typing import List
from botocore.exceptions import NoCredentialsError, ClientError

router = APIRouter(prefix="/upload", tags=["文件上传"])

# 从环境变量获取 S3 配置
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_PUBLIC_DOMAIN = os.getenv("S3_PUBLIC_DOMAIN") # 您的 R2 公开访问域名 (如 pub-xxx.r2.dev)

def get_s3_client():
    """创建一个 S3 客户端"""
    return boto3.client(
        "s3",
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        # 兼容 MinIO/OSS: 如果有 Endpoint 则不传 Region
        region_name=S3_REGION if S3_REGION else None,
        endpoint_url=S3_ENDPOINT_URL if S3_ENDPOINT_URL else None
    )

@router.post("/image")
async def upload_file(file: UploadFile = File(...)):
    # 检查环境变量是否配置
    if not S3_ACCESS_KEY or not S3_SECRET_KEY or not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 配置缺失，请检查后端 .env 文件")

    # 验证文件类型 (支持图片和视频)
    if not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="只允许上传图片或视频文件")
    
    # 生成唯一文件名
    file_extension = os.path.splitext(file.filename)[1]
    new_filename = f"{uuid.uuid4()}{file_extension}"
    
    try:
        s3_client = get_s3_client()
        # 上传文件到 S3
        s3_client.upload_fileobj(
            file.file,
            S3_BUCKET_NAME,
            new_filename,
            ExtraArgs={
                "ContentType": file.content_type,
                # 如果是某些不默认公开的 Bucket，可能需要 ACL='public-read'
                # "ACL": "public-read" 
            }
        )
        
        # 生成访问 URL
        if S3_PUBLIC_DOMAIN:
            # 优先使用配置的公开域名（适用于 Cloudflare R2 / CDN 等）
            # 兼容带不带 https:// 前缀的情况
            domain = S3_PUBLIC_DOMAIN
            if not domain.startswith("http"):
                domain = f"https://{domain}"
            url = f"{domain}/{new_filename}"
        elif S3_ENDPOINT_URL:
            # 如果是 MinIO 或兼容 S3 的服务，且没有配置公开域名
            # 这里简单拼装，具体服务可能不一样，R2 必须配置 PUBLIC_DOMAIN 才能访问
            url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{new_filename}"
        else:
            # 标准 AWS S3 URL 格式
            url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{new_filename}"
            
        return {"url": url}

    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="无法找到 S3 凭证")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 上传失败: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"未知错误: {str(e)}")

@router.post("/images")
async def upload_files(files: List[UploadFile] = File(...)):
    # 检查环境变量
    if not S3_ACCESS_KEY or not S3_SECRET_KEY or not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 配置缺失")

    s3_client = get_s3_client()
    urls = []
    
    for file in files:
        if not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
            continue
            
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        
        try:
            s3_client.upload_fileobj(
                file.file,
                S3_BUCKET_NAME,
                new_filename,
                ExtraArgs={"ContentType": file.content_type}
            )
            
            if S3_PUBLIC_DOMAIN:
                # 优先使用配置的公开域名（适用于 Cloudflare R2 / CDN 等）
                # 兼容带不带 https:// 前缀的情况
                domain = S3_PUBLIC_DOMAIN
                if not domain.startswith("http"):
                    domain = f"https://{domain}"
                url = f"{domain}/{new_filename}"
            elif S3_ENDPOINT_URL:
                url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{new_filename}" 
            else:
                url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{new_filename}"
            
            urls.append(url)
            
        except Exception as e:
            # 单个文件上传失败不应中断所有上传，但可以记录错误
            print(f"Failed to upload {file.filename}: {e}")
            continue
        
    return {"urls": urls}
