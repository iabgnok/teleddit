// lib/mock/tags.ts
// 标签（Flair）系统：每个社区有专属预设标签库
// color 对应 TagBadge 组件的样式 map key

export type TagColor =
  | "blue" | "purple" | "emerald" | "orange" | "rose"
  | "yellow" | "cyan" | "slate" | "violet" | "amber";

export interface TagDef {
  id: string;
  name: string;
  color: TagColor;
  space_id: string;
  post_count: number; // 该标签下的帖文数量（用于排序和热度展示）
  is_required?: boolean; // 是否强制发帖时必选
}

// ─── r/nextjs_dev ───────────────────────────────────────────
export const TAGS_NEXTJS: TagDef[] = [
  { id: "nj-tag-1", name: "讨论",       color: "blue",    space_id: "mock-community-001", post_count: 128 },
  { id: "nj-tag-2", name: "教程",       color: "emerald", space_id: "mock-community-001", post_count: 97  },
  { id: "nj-tag-3", name: "展示",       color: "purple",  space_id: "mock-community-001", post_count: 64  },
  { id: "nj-tag-4", name: "求助",       color: "orange",  space_id: "mock-community-001", post_count: 210 },
  { id: "nj-tag-5", name: "性能优化",   color: "cyan",    space_id: "mock-community-001", post_count: 43  },
  { id: "nj-tag-6", name: "App Router", color: "violet",  space_id: "mock-community-001", post_count: 156 },
  { id: "nj-tag-7", name: "Server Actions", color: "amber", space_id: "mock-community-001", post_count: 89 },
  { id: "nj-tag-8", name: "基准测试",   color: "rose",    space_id: "mock-community-001", post_count: 31  },
];

// ─── r/ui_design ────────────────────────────────────────────
export const TAGS_UI_DESIGN: TagDef[] = [
  { id: "ui-tag-1", name: "资源分享",   color: "purple",  space_id: "mock-community-002", post_count: 167 },
  { id: "ui-tag-2", name: "观点",       color: "orange",  space_id: "mock-community-002", post_count: 89  },
  { id: "ui-tag-3", name: "教程",       color: "emerald", space_id: "mock-community-002", post_count: 112 },
  { id: "ui-tag-4", name: "动效",       color: "cyan",    space_id: "mock-community-002", post_count: 74  },
  { id: "ui-tag-5", name: "组件库",     color: "blue",    space_id: "mock-community-002", post_count: 203 },
  { id: "ui-tag-6", name: "设计系统",   color: "violet",  space_id: "mock-community-002", post_count: 58  },
  { id: "ui-tag-7", name: "排版",       color: "amber",   space_id: "mock-community-002", post_count: 45  },
];

// ─── r/ai_frontier ──────────────────────────────────────────
export const TAGS_AI: TagDef[] = [
  { id: "ai-tag-1", name: "测评",       color: "rose",    space_id: "mock-community-003", post_count: 234 },
  { id: "ai-tag-2", name: "新闻",       color: "blue",    space_id: "mock-community-003", post_count: 312 },
  { id: "ai-tag-3", name: "本地部署",   color: "emerald", space_id: "mock-community-003", post_count: 98  },
  { id: "ai-tag-4", name: "提示词",     color: "purple",  space_id: "mock-community-003", post_count: 178 },
  { id: "ai-tag-5", name: "观点",       color: "orange",  space_id: "mock-community-003", post_count: 145 },
  { id: "ai-tag-6", name: "实战案例",   color: "cyan",    space_id: "mock-community-003", post_count: 67  },
  { id: "ai-tag-7", name: "硬件",       color: "amber",   space_id: "mock-community-003", post_count: 54  },
  { id: "ai-tag-8", name: "精华",       color: "yellow",  space_id: "mock-community-003", post_count: 29, is_required: false },
];

// ─── r/indie_hacker_cn ──────────────────────────────────────
export const TAGS_INDIE: TagDef[] = [
  { id: "ih-tag-1", name: "里程碑",     color: "emerald", space_id: "mock-community-004", post_count: 87  },
  { id: "ih-tag-2", name: "工具推荐",   color: "blue",    space_id: "mock-community-004", post_count: 134 },
  { id: "ih-tag-3", name: "复盘",       color: "orange",  space_id: "mock-community-004", post_count: 76  },
  { id: "ih-tag-4", name: "增长",       color: "cyan",    space_id: "mock-community-004", post_count: 112 },
  { id: "ih-tag-5", name: "融资",       color: "violet",  space_id: "mock-community-004", post_count: 43  },
  { id: "ih-tag-6", name: "求助",       color: "rose",    space_id: "mock-community-004", post_count: 198 },
  { id: "ih-tag-7", name: "出海",       color: "amber",   space_id: "mock-community-004", post_count: 65  },
];

// ─── 主映射表 ────────────────────────────────────────────────
export const SPACE_TAGS: Record<string, TagDef[]> = {
  "mock-community-001": TAGS_NEXTJS,
  "mock-community-002": TAGS_UI_DESIGN,
  "mock-community-003": TAGS_AI,
  "mock-community-004": TAGS_INDIE,
};

// 按 post_count 降序取热门标签
export function getTopTags(communityId: string, limit = 5): TagDef[] {
  const tags = SPACE_TAGS[communityId] ?? [];
  return [...tags].sort((a, b) => b.post_count - a.post_count).slice(0, limit);
}

// 通过 tag id 查找 TagDef
export function findTagById(tagId: string): TagDef | undefined {
  for (const tags of Object.values(SPACE_TAGS)) {
    const found = tags.find((t) => t.id === tagId);
    if (found) return found;
  }
  return undefined;
}