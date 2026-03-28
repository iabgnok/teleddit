# Teleddit 前端-后端接口接入说明文档

本文档基于当前前端功能模块（如认证、社区、帖子、动态、评论等）整理了前端所需的 API 接口及数据结构，用于指导后端的接口开发与对接。

## 1. 基础说明

- **Base URL**: `http://localhost:8000` (可通过 `NEXT_PUBLIC_API_URL` 环境变量配置)
- **请求格式**: 默认使用 `application/json`，文件上传使用 `multipart/form-data`。
- **认证方式**: 使用 Bearer Token 鉴权（`Authorization: Bearer <access_token>`），Token 由前端在登录/注册成功后保存在 localStorage。
- **标准错误响应**:
  ```json
  {
    "detail": "具体的错误信息，可以是字符串或对象"
  }
  ```

---

## 2. 核心业务模块接口

### 2.1 认证模块 (Auth)

前端使用 `AuthContext.tsx` 统一管理登录状态。

- **[POST] `/auth/login`**
  - **用途**: 用户登录
  - **请求体**: `{ "username": "...", "password": "..." }`
  - **响应**: `{ "access_token": "xxx", "user": { "id": "...", "username": "..." } }`

- **[POST] `/auth/register`**
  - **用途**: 用户注册
  - **请求体**: `{ "username": "...", "password": "...", "email": "..." }`
  - **响应**: 同登录

- **[GET] `/users/me`**
  - **用途**: 获取当前登录用户信息（用于刷新页面时恢复状态）
  - **响应**: `{ "id": "...", "username": "...", "avatar_url": "..." }`

### 2.2 社区与文件夹模块 (Community & Folder)

前端侧边栏（`UnifiedSidebar.tsx`）强依赖此模块。

- **[GET] `/communities`**
  - **用途**: 获取当前用户加入的或公开的社区列表
  - **响应**: 
    ```json
    [
      {
        "id": "1",
        "type": "community",
        "name": "游戏",
        "avatarUrl": "...",
        "lastPreviewText": "最新帖子的预览",
        "lastActivityAt": "2023-10-01T12:00:00Z",
        "unreadCount": 5,
        "isPinned": false,
        "isMuted": false
      }
    ]
    ```

- **[POST] `/folders`** & **[PUT] `/folders/:id`** & **[DELETE] `/folders/:id`**
  - **用途**: 管理侧边栏的自定义社区分组（前端目前使用本地状态，后续需持久化）
  - **数据结构**: 
    ```json
    {
      "id": "folder-1",
      "name": "常用",
      "icon": "⭐",
      "color": "blue",
      "communityIds": ["1", "2"],
      "order": 0
    }
    ```

### 2.3 帖子模块 (Post)

前端的核心流模块（`MasonryFeed.tsx`, `ListFeed.tsx`, `PostModal.tsx`）。

- **[GET] `/posts`**
  - **用途**: 获取帖子列表（支持按社区、按标签、分页）
  - **Query参数**: `?community_id=xxx&tag=xxx&page=1&limit=20`

- **[POST] `/posts`**
  - **用途**: 创建帖子
  - **请求体** (`CreatePostPayload`):
    ```json
    {
      "title": "帖子标题",
      "content": "富文本HTML或纯文本",
      "contentType": "text | media | link",
      "communityId": "...",
      "tagIds": ["tag1", "tag2"],
      "isDraft": false,
      "coverUrl": "...",
      "mediaUrls": ["url1", "url2"],
      "linkUrl": "..."
    }
    ```

- **[GET] `/posts/:id`**
  - **用途**: 获取帖子详情

- **[POST] `/posts/:id/vote`**
  - **用途**: 给帖子投票（Upvote / Downvote）
  - **请求体**: `{ "value": 1 }` (1为顶，-1为踩，0为取消)

### 2.4 评论模块 (Comment)

前端采用嵌套结构的树状评论（`CommentItem.tsx`）。

- **[GET] `/posts/:id/comments`**
  - **用途**: 获取帖子的评论树
  - **响应要求**: 最好由后端直接组装成树状结构，包含 `children: []`，或返回扁平结构由前端组装。
  
- **[POST] `/posts/:id/comments`**
  - **用途**: 发表评论
  - **请求体**: `{ "content": "...", "parent_id": "可选，回复某条评论的ID" }`

- **[DELETE] `/comments/:id`**
  - **用途**: 删除自己的评论

- **[POST] `/comments/:id/vote`**
  - **用途**: 给评论投票

### 2.5 媒体与文件模块 (Media Upload)

前端依赖上传接口获取外部可访问的 URL。

- **[POST] `/upload/image`** (或 `/upload/media`)
  - **用途**: 上传图片/视频，用于富文本编辑器插入或发布媒体帖。
  - **请求类型**: `multipart/form-data`
  - **响应**: `{ "url": "https://cdn.example.com/image.png" }`

### 2.6 链接预览模块 (Link Preview)

- **[POST] `/link-preview`**
  - **用途**: 抓取外部链接的 Meta 信息（标题、描述、封面图），用于“链接帖”展示。
  - **请求体**: `{ "url": "https://example.com" }`
  - **响应**:
    ```json
    {
      "title": "网页标题",
      "description": "网页描述...",
      "image": "封面图URL",
      "domain": "example.com"
    }
    ```

---

## 3. 后续优化建议

1. **WebSocket / SSE 接入**: 目前前端有 `unreadCount` 和 `lastPreviewText` 的概念，后续建议通过 WebSocket 推送实时更新，替代轮询或刷新。
2. **光标分页 (Cursor-based Pagination)**: 对于瀑布流（`MasonryFeed`），推荐后端使用 `cursor` 而非 `page/limit`，以避免数据重复或遗漏。
3. **嵌套评论的分页**: 如果评论层级很深或数量极大，后端需支持评论的分页加载（如：只返回前两层，点击展开加载更多）。
