"use client";

// ════════════════════════════════════════════════════════════════════════
// 📌 分类折叠组组件 (SectionGroup)
// 负责渲染侧边栏中可折叠的空间分类（如“社区”）
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CommunityItem } from "@/types/community";
import { SpaceRow } from "./SpaceRow";

interface SectionGroupProps {
  title: string;
  communities: CommunityItem[];
  childSpaces?: CommunityItem[];
  selectedId: string | null;
  onSelect: (s: CommunityItem) => void;
  onContextMenu: (e: React.MouseEvent, s: CommunityItem) => void;
}

export function SectionGroup({
  title,
  communities,
  childSpaces,
  selectedId,
  onSelect,
  onContextMenu,
}: SectionGroupProps) {
  const [open, setOpen] = useState(true);

  if (communities.length === 0) return null;

  return (
    <div className="mb-0.5">
      {/* 折叠/展开头部 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-1.5
          text-[10px] font-black text-slate-600 uppercase tracking-widest
          hover:text-slate-400 transition-colors"
      >
        {title}
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {/* 列表内容区域 */}
      {open &&
        communities.map((community) => (
          <div key={community.id}>
            <SpaceRow
              community={community}
              isActive={community.id === selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
            {/* 渲染子空间（如果有） */}
            {childSpaces?.map((child) => (
              <SpaceRow
                key={child.id}
                community={child}
                isActive={child.id === selectedId}
                isChild
                onSelect={onSelect}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
