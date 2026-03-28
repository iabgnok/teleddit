// types/community.ts
// Teleddit 统一「空间」类型系统

export type SpaceType = "community";  // 论坛社区

export type SidebarFilter = "all" | "community";

export type CommunityItem = {
  id: string;
  type: SpaceType;
  name: string;
  avatarUrl?: string;
  lastActivityAt: string;
  lastPreviewText?: string;
  unreadCount: number;
  memberCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
};

export type ContentViewMode =
  | "forum-feed"
  | "forum-post";

export function getDefaultViewMode(type: SpaceType): ContentViewMode {
  return "forum-feed";
}

export function getSupportedViewModes(type: SpaceType): ContentViewMode[] {
  return ["forum-feed"];
}