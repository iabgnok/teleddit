"use client";

// ════════════════════════════════════════════════════════════════════════
// 📌 侧边栏单个空间行组件 (SpaceRow)
// 负责渲染侧边栏中的单个社区或子空间项
// ════════════════════════════════════════════════════════════════════════

import { Pin, BellOff } from "lucide-react";
import type { CommunityItem } from "@/types/community";

const TYPE_GRADIENT: Record<string, string> = {
  community: "from-orange-500 to-red-500",
};

interface SpaceRowProps {
  community: CommunityItem;
  isActive: boolean;
  isChild?: boolean;
  onSelect: (s: CommunityItem) => void;
  onContextMenu: (e: React.MouseEvent, s: CommunityItem) => void;
}

export function SpaceRow({
  community,
  isActive,
  isChild = false,
  onSelect,
  onContextMenu,
}: SpaceRowProps) {
  const grad = TYPE_GRADIENT[community.type] || "from-slate-500 to-slate-700";
  const initials = community.name.slice(0, 2).toUpperCase();
  const unread = community.unreadCount > 0
    ? (community.unreadCount > 99 ? "99+" : String(community.unreadCount))
    : null;

  return (
    <div
      onClick={() => onSelect(community)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, community); }}
      className={`relative flex items-center gap-2.5 cursor-pointer select-none
        transition-colors duration-100 group/row border-l-2
        ${isChild ? "pl-8 pr-3 py-1.5" : "px-3 py-1.5"}
        ${isActive ? "bg-white/8 border-blue-500" : "hover:bg-white/5 border-transparent"}`}
    >
      {/* 头像区域 */}
      <div className={`shrink-0 flex items-center justify-center text-white font-black
        bg-gradient-to-br ${grad} shadow-sm relative
        ${isChild ? "w-8 h-8 rounded-xl text-[10px]" : "w-10 h-10 rounded-2xl text-[11px]"}`}>
          {community.avatarUrl && community.avatarUrl !== "string"
            ? <img src={community.avatarUrl} alt="" className="w-full h-full object-cover rounded-inherit" />
            : initials
          }
      </div>

      {/* 文字信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`text-[13px] font-semibold truncate
            ${isActive ? "text-white" : "text-slate-200"}`}>
            {community.name}
          </span>
          {community.isPinned && <Pin size={9} className="text-slate-500 shrink-0" />}
          {community.isMuted && <BellOff size={9} className="text-slate-500 shrink-0" />}
        </div>
        {community.lastPreviewText && (
          <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
            {community.lastPreviewText}
          </p>
        )}
      </div>

      {/* 未读徽章 */}
      {unread && (
        <span className={`shrink-0 min-w-[18px] h-[18px] px-1 rounded-full
          text-[10px] font-black flex items-center justify-center
          ${community.isMuted ? "bg-white/15 text-slate-400" : "bg-blue-500 text-white"}`}>
          {unread}
        </span>
      )}
    </div>
  );
}
