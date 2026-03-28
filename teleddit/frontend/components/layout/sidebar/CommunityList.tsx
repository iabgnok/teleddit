"use client";

// components/sidebar/CommunityList.tsx
// 带滚动容器的空间列表，处理加载态和空状态。

import type { CommunityItem } from "@/types/community";
import { CommunityListItem } from "@/components/layout/sidebar/CommunityListItem";
import { Layers } from "lucide-react";

interface CommunityListProps {
  communities: CommunityItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (community: CommunityItem) => void;
}

// ─── 骨架屏 ────────────────────────────
function SkeletonItem() {
  return (
    <div className="px-2 py-2.5 mx-1 flex items-center gap-3 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-white/5 shrink-0" />
      <div className="flex-1 community-y-2">
        <div className="h-3 bg-white/5 rounded-full w-3/4" />
        <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
      </div>
    </div>
  );
}

// ─── 空状态 ────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-600">
      <Layers size={32} strokeWidth={1} />
      <p className="text-xs text-center leading-relaxed">
        暂无空间<br />
        <span className="text-slate-700">加入社区或开始对话</span>
      </p>
    </div>
  );
}

// ─── 主组件 ────────────────────────────
export function CommunityList({ communities, loading, selectedId, onSelect }: CommunityListProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 community-y-0.5
      scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {loading ? (
        // 骨架屏：显示 5 个占位
        Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
      ) : communities.length === 0 ? (
        <EmptyState />
      ) : (
        communities.map((community) => (
          <CommunityListItem
            key={community.id}
            community={community}
            isActive={community.id === selectedId}
            onClick={() => onSelect(community)}
          />
        ))
      )}
    </div>
  );
}