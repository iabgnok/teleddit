import { useState, useMemo, useCallback, useRef } from "react";
import { FolderPen, Search, Plus } from "lucide-react";
import type { FolderItem } from "@/types/folder";
import type { CommunityItem } from "@/types/community";

interface FolderTabsProps {
  folders: FolderItem[];
  activeId: string;
  onSelect: (id: string) => void;
  communities: CommunityItem[];
  onEdit: (f: FolderItem) => void;
  onAdd: () => void;
}

export default function FolderTabs({
  folders, activeId, onSelect, communities, onEdit, onAdd,
}: FolderTabsProps) {
  const [folderCtx, setFolderCtx] = useState<{ folder: FolderItem; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 鼠标滚轮横向滚动支持
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  // 未读计数
  const unreadMap = useMemo(() => {
    const map: Record<string, number> = {};
    folders.forEach((f) => {
      map[f.id] = f.communityIds.length === 0
        ? communities.reduce((s, sp) => s + sp.unreadCount, 0)
        : communities.filter((sp) => f.communityIds.includes(sp.id)).reduce((s, sp) => s + sp.unreadCount, 0);
    });
    return map;
  }, [folders, communities]);

  const sorted = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders]);

  return (
    <>
      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 px-1.5 py-1.5 border-b border-white/5 shrink-0 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {sorted.map((folder) => {
          const isActive = folder.id === activeId;
          const unread = unreadMap[folder.id] ?? 0;
          return (
            <button
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              onContextMenu={(e) => { e.preventDefault(); setFolderCtx({ folder, x: e.clientX, y: e.clientY }); }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium
                whitespace-nowrap transition-all shrink-0 select-none rounded-xl
                group/tab border border-transparent
                ${isActive 
                  ? "text-white bg-blue-500/20 border-blue-500/30 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/10"}`}
            >
              {folder.emoji && <span className="text-sm leading-none">{folder.emoji}</span>}
              <span>{folder.label}</span>
              {unread > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black
                  flex items-center justify-center
                  ${isActive ? "bg-blue-500 text-white" : "bg-white/15 text-slate-300"}`}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {/* 非系统文件夹悬停显示编辑按钮 */}
              {!folder.isSystem && (
                <span
                  onClick={(e) => { e.stopPropagation(); onEdit(folder); }}
                  className="opacity-0 group-hover/tab:opacity-100 transition-opacity ml-0.5
                    text-slate-600 hover:text-slate-300"
                >
                  <FolderPen size={11} />
                </span>
              )}
            </button>
          );
        })}
        {/* 新建文件夹按钮 */}
        <button onClick={onAdd} title="新建文件夹"
          className="shrink-0 w-8 h-8 ml-1 flex items-center justify-center rounded-xl bg-white/5
            text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* 文件夹右键菜单 */}
      {folderCtx && (
        <div
          className="fixed z-[9999]"
          style={{ left: folderCtx.x, top: folderCtx.y }}
          onMouseLeave={() => setFolderCtx(null)}
        >
          <div className="bg-[#212121]/96 backdrop-blur-xl border border-white/10
            rounded-2xl shadow-2xl shadow-black/70 py-1.5 w-44 overflow-hidden
            animate-in fade-in zoom-in-95 duration-100">
            {!folderCtx.folder.isSystem && (
              <button
                onClick={() => { onEdit(folderCtx.folder); setFolderCtx(null); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px]
                  text-slate-200 hover:bg-white/8 transition-colors">
                <FolderPen size={14} className="text-slate-400" />
                编辑文件夹
              </button>
            )}
            <button
              onClick={() => { onSelect(folderCtx.folder.id); setFolderCtx(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px]
                text-slate-200 hover:bg-white/8 transition-colors">
              <Search size={14} className="text-slate-400" />
              标记全部为已读
            </button>
          </div>
        </div>
      )}
    </>
  );
}
