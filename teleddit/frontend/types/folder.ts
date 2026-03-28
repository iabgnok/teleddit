// types/folder.ts
// Teleddit 空间文件夹（仿 Telegram Chat Folders 设计）

import type { SpaceType } from "./community";

export type FolderAutoInclude =
  | "community" | "direct" | "group" | "channel" | "aggregate"
  | "unread" | "pinned";

export type FolderAutoExclude = "muted" | "read" | "archived";

export interface FolderItem {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  communityIds: string[];
  autoInclude?: FolderAutoInclude[];
  autoExclude?: FolderAutoExclude[];
  pinnedSpaceIds?: string[];
  order: number;
  isSystem?: boolean;
}