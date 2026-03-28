// lib/mock/communities.ts
import type { CommunityItem } from "@/types/community";
import type { FolderItem } from "@/types/folder";

export const MOCK_SPACES: CommunityItem[] = [
  { id: "mock-community-001", type: "community", name: "nextjs_dev",
    lastActivityAt: new Date(Date.now() - 1000*60*18).toISOString(),
    lastPreviewText: "新帖：App Router 中如何优雅处理 Loading UI？",
    unreadCount: 5, memberCount: 12847, isPinned: true },
  { id: "mock-community-002", type: "community", name: "ui_design",
    lastActivityAt: new Date(Date.now() - 1000*60*60*3).toISOString(),
    lastPreviewText: "新帖：分享一套暗色主题 Tailwind 组件库",
    unreadCount: 2, memberCount: 8203 },
  { id: "mock-community-003", type: "community", name: "ai_frontier",
    lastActivityAt: new Date(Date.now() - 1000*60*60*24).toISOString(),
    lastPreviewText: "新帖：Claude 3.7 发布，Thinking Mode 实测报告",
    unreadCount: 0, memberCount: 31560 },
  { id: "mock-community-004", type: "community", name: "indie_hacker_cn",
    lastActivityAt: new Date(Date.now() - 1000*60*60*24*3).toISOString(),
    lastPreviewText: "新帖：我的 SaaS 产品上线 3 个月复盘",
    unreadCount: 0, memberCount: 5921 },
];

// ── 预置文件夹 ─────────────────────────────────────────────────
// 遵循 Telegram 设计：系统文件夹"全部"不可删；其余用户可编辑
export const DEFAULT_FOLDERS: FolderItem[] = [
  { id: "folder-all",    label: "全部",  emoji: "💬", communityIds: [], order: 0, isSystem: true },
  { id: "folder-dev",    label: "开发",  emoji: "⚡", color: "blue",
    communityIds: ["mock-community-001","mock-community-003"],
    order: 1 },
  { id: "folder-design", label: "设计",  emoji: "🎨", color: "pink",
    communityIds: ["mock-community-002"], order: 2 },
  { id: "folder-indie",  label: "独立",  emoji: "🚀", color: "orange",
    communityIds: ["mock-community-004"], order: 3 },
];