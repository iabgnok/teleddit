"use client";

// components/sidebar/CommunityListItem.tsx
// 侧栏单个空间列表项。
// 支持五种类型，视觉语言各有差异，但布局结构一致：
// [Avatar] [名称 + 时间] [预览文字] [未读红点]

import type { CommunityItem, SpaceType } from "@/types/community";
import { CommunityAvatar } from "@/components/features/community/CommunityAvatar";

// 每种类型的名称前缀和未读红点颜色
const TYPE_META: Record<SpaceType, { prefix: string; badgeColor: string }> = {
  community: { prefix: "r/",  badgeColor: "bg-orange-500" },
};

// ─── 相对时间（从父级 hook 传入的格式化函数）──
function RelativeTime({ timeStr }: { timeStr: string }) {
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let label: string;
  if (diffMins < 1) label = "刚刚";
  else if (diffMins < 60) label = `${diffMins}m`;
  else if (diffHours < 24) label = `${diffHours}h`;
  else if (diffDays === 1) label = "昨天";
  else if (diffDays < 7) {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    label = `周${days[date.getDay()]}`;
  } else {
    label = `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return <span className="text-[10px] text-slate-500 shrink-0">{label}</span>;
}

// ─── 未读数红点 ──────────────────────────
function UnreadBadge({ count, colorClass }: { count: number; colorClass: string }) {
  if (count <= 0) return null;
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center
        text-[10px] font-black text-white shrink-0 ${colorClass}`}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
}

// ─── 主组件 ─────────────────────────────
interface CommunityListItemProps {
  community: CommunityItem;
  isActive: boolean;
  onClick: () => void;
}

export function CommunityListItem({ community, isActive, onClick }: CommunityListItemProps) {
  const meta = TYPE_META[community.type];

  return (
    <div
      onClick={onClick}
      className={`
        px-2 py-2.5 mx-1 flex items-center gap-3 rounded-xl cursor-pointer
        transition-all duration-150 group select-none
        ${
          isActive
            ? "bg-blue-600/15 border-l-2 border-blue-500"
            : "hover:bg-white/5 border-l-2 border-transparent"
        }
      `}
    >
      {/* 头像 */}
      <CommunityAvatar community={community} />

      {/* 文字区域 */}
      <div className="flex-1 min-w-0">
        {/* 第一行：名称 + 时间 */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-bold text-sm truncate transition-colors
              ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}
          >
            {meta.prefix}
            {community.name}
          </span>
          <RelativeTime timeStr={community.lastActivityAt} />
        </div>

        {/* 第二行：预览文字 + 红点 */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-xs truncate ${
              community.unreadCount > 0
                ? "text-slate-300 font-medium"
                : "text-slate-500"
            }`}
          >
            {community.lastPreviewText ?? "暂无动态"}
          </p>
          <UnreadBadge count={community.unreadCount} colorClass={meta.badgeColor} />
        </div>
      </div>
    </div>
  );
}