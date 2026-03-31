"use client";
// components/sidebar/CommunityContextMenu.tsx

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink, Eye, FolderPlus, CheckCheck,
  Pin, PinOff, BellOff, Bell, Archive, Flag, LogOut,
  ChevronRight, Check,
} from "lucide-react";
import type { CommunityItem } from "@/types/community";
import type { FolderItem } from "@/types/folder";

export interface ContextMenuState {
  x: number; y: number; community: CommunityItem;
}

interface Props {
  state: ContextMenuState;
  folders: FolderItem[];
  onClose: () => void;
  onMarkRead: (s: CommunityItem) => void;
  onPin: (s: CommunityItem) => void;
  onMute: (s: CommunityItem) => void;
  onArchive: (s: CommunityItem) => void;
  onAddToFolder: (communityId: string, folderId: string) => void;
  onRemoveFromFolder: (communityId: string, folderId: string) => void;
  onCreateFolderWith: (community: CommunityItem) => void;
}

function Divider() {
  return <div className="my-1 mx-3 h-px bg-white/8" />;
}

function Item({ icon, label, onClick, danger, right }: {
  icon: React.ReactNode; label: string; onClick?: () => void;
  danger?: boolean; right?: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-[9px] text-[13px] transition-colors
        ${danger ? "text-red-400 hover:bg-red-500/10" : "text-slate-200 hover:bg-white/8"}`}>
      <span className={danger ? "text-red-400" : "text-slate-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {right}
    </button>
  );
}

export function CommunityContextMenu({ state, folders, onClose, onMarkRead, onPin, onMute,
  onArchive, onAddToFolder, onRemoveFromFolder, onCreateFolderWith }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showFolderSub, setShowFolderSub] = useState(false);
  const { x, y, community } = state;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const menuW = 228;
  const safeX = Math.min(x, vw - menuW - 8);
  const safeY = Math.min(y, vh - 400);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const nonSystemFolders = folders.filter((f) => !f.isSystem);
  const spaceFolderIds = nonSystemFolders.filter((f) => f.communityIds.includes(community.id)).map((f) => f.id);

  const leaveLabel = "退出社区";
  const isSpecialSpace = community.id === "__saved__" || community.id === "__my_posts__" || community.id === "square";

  const content = (
    <div ref={ref} style={{ left: safeX, top: safeY, width: menuW, position: "fixed" }}
      className="z-[9999] bg-[#212121]/96 backdrop-blur-xl border border-white/10
        rounded-2xl shadow-2xl shadow-black/70 py-1.5 overflow-visible
        animate-in fade-in zoom-in-95 duration-100 origin-top-left">

      <Item icon={<ExternalLink size={15} />} label="在新标签页打开" onClick={onClose} />
      <Item icon={<Eye size={15} />} label="快速预览" onClick={onClose} />
      <Divider />

      {/* 添加到文件夹（悬停展开子菜单） */}
      <div className="relative"
        onMouseEnter={() => setShowFolderSub(true)}
        onMouseLeave={() => setShowFolderSub(false)}>
        <button className="w-full flex items-center gap-3 px-4 py-[9px] text-[13px]
          text-slate-200 hover:bg-white/8 transition-colors">
          <FolderPlus size={15} className="text-slate-400" />
          <span className="flex-1 text-left">添加到文件夹</span>
          <ChevronRight size={13} className="text-slate-500" />
        </button>

        {showFolderSub && (
          <div className="absolute left-full top-0 ml-1 w-52 z-[10000]
            bg-[#252525]/96 backdrop-blur-xl border border-white/10
            rounded-2xl shadow-2xl shadow-black/70 py-1.5 overflow-hidden">
            {nonSystemFolders.map((f) => {
              const inFolder = spaceFolderIds.includes(f.id);
              return (
                <button key={f.id}
                  onClick={() => { inFolder ? onRemoveFromFolder(community.id, f.id) : onAddToFolder(community.id, f.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-[9px]
                    text-[13px] text-slate-200 hover:bg-white/8 transition-colors">
                  <span className="w-5 text-center text-base leading-none">{f.emoji ?? "📁"}</span>
                  <span className="flex-1 text-left truncate">{f.label}</span>
                  {inFolder && <Check size={13} className="text-blue-400 shrink-0" />}
                </button>
              );
            })}
            {nonSystemFolders.length > 0 && <div className="my-1 mx-3 h-px bg-white/8" />}
            <button onClick={() => { onCreateFolderWith(community); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-[9px]
                text-[13px] text-blue-400 hover:bg-white/8 transition-colors">
              <FolderPlus size={14} className="text-blue-400" />
              新建文件夹...
            </button>
          </div>
        )}
      </div>

      <Item icon={<CheckCheck size={15} />} label="标记为已读"
        onClick={() => { onMarkRead(community); onClose(); }} />
      <Item icon={community.isPinned ? <PinOff size={15}/> : <Pin size={15}/>}
        label={community.isPinned ? "取消置顶" : "置顶"}
        onClick={() => { onPin(community); onClose(); }} />
      <Item icon={community.isMuted ? <Bell size={15}/> : <BellOff size={15}/>}
        label={community.isMuted ? "取消静音" : "静音"}
        onClick={() => { onMute(community); onClose(); }} />
      {!isSpecialSpace && (
        <>
          <Divider />
          <Item icon={<Archive size={15} />} label="归档"
            onClick={() => { onArchive(community); onClose(); }} />
          <Item icon={<Flag size={15} />} label="举报" onClick={onClose} />
          <Divider />
          <Item icon={<LogOut size={15} />} label={leaveLabel} onClick={onClose} danger />
        </>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}