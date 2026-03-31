"use client";
// components/sidebar/FolderEditModal.tsx
// 新建/编辑文件夹弹窗
// 功能：命名、选 emoji 图标、选包含的空间、保存/删除

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Check, Search, ChevronRight, Trash2,
  Hash, MessageCircle, Users, Radio, Layers,
} from "lucide-react";
import type { FolderItem } from "@/types/folder";
import type { CommunityItem, SpaceType } from "@/types/community";

// ─── Emoji 选项池 ───────────────────────────────────────────
const EMOJI_OPTIONS = [
  "💬","⚡","🎨","✉️","🚀","🔥","⭐","💡","🛠️","📌",
  "🎯","🌐","🤖","📚","💼","🎮","🎵","🏠","🔔","🌟",
];

// ─── 空间类型图标 ───────────────────────────────────────────
const TYPE_ICON: Record<SpaceType, React.ElementType> = {
  community: Hash,
};
const TYPE_GRADIENT: Record<SpaceType, string> = {
  community: "from-orange-500 to-red-500",
};
const TYPE_LABEL: Record<SpaceType, string> = {
  community: "社区",
};

interface FolderEditModalProps {
  folder: FolderItem | null;   // null = 新建模式
  communities: CommunityItem[];
  onSave: (folder: FolderItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function FolderEditModal({
  folder, communities, onSave, onDelete, onClose,
}: FolderEditModalProps) {
  const isNew = folder === null;

  // 表单状态
  const [label, setLabel]       = useState(folder?.label ?? "");
  const [emoji, setEmoji]       = useState(folder?.emoji ?? "💬");
  const [selected, setSelected] = useState<string[]>(folder?.communityIds ?? []);
  const [search, setSearch]     = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const labelRef = useRef<HTMLInputElement>(null);
  useEffect(() => { labelRef.current?.focus(); }, []);

  // 搜索过滤空间
  const filteredSpaces = communities.filter((s) => {
    if (!search.trim()) return true;
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSpace = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: folder?.id ?? `folder-${Date.now()}`,
      label: label.trim(),
      emoji,
      communityIds: selected,
      order: folder?.order ?? 999,
      isSystem: folder?.isSystem,
    });
    onClose();
  };

  const content = (
    // 遮罩
    <div
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[460px] max-h-[80vh] bg-[#1c1c1c] border border-white/10 rounded-3xl
        shadow-2xl shadow-black/80 flex flex-col overflow-hidden
        animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/6">
          <h2 className="text-[15px] font-black text-white">
            {isNew ? "新建文件夹" : "编辑文件夹"}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
              text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* 图标 + 名称 */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-5">
              {/* Emoji 选择器触发按钮 */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-12 h-12 rounded-2xl bg-white/8 hover:bg-white/12
                    flex items-center justify-center text-2xl transition-all
                    border border-white/8 hover:border-white/20"
                >
                  {emoji}
                </button>
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute top-14 left-0 z-20 bg-[#252525] border border-white/10
                      rounded-2xl p-3 grid grid-cols-5 gap-1.5 shadow-2xl w-44
                      animate-in fade-in zoom-in-95 duration-100">
                      {EMOJI_OPTIONS.map((e) => (
                        <button key={e}
                          onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg
                            transition-all hover:bg-white/10
                            ${emoji === e ? "bg-blue-600/30 ring-1 ring-blue-500" : ""}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 名称输入 */}
              <div className="flex-1">
                <input
                  ref={labelRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="文件夹名称"
                  maxLength={24}
                  className="w-full bg-white/5 border border-white/8 rounded-xl
                    px-4 py-2.5 text-[14px] text-white placeholder:text-slate-600
                    focus:outline-none focus:border-blue-500/50 transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                />
                <p className="text-[11px] text-slate-600 mt-1.5 px-1">
                  {label.length}/24
                </p>
              </div>
            </div>

            {/* 已选数量提示 */}
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
              已选空间 · {selected.length}
            </p>
          </div>

          {/* 空间搜索 */}
          <div className="px-6 pb-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索空间..."
                className="w-full bg-white/5 border border-white/5 rounded-xl
                  py-2 pl-8 pr-3 text-[13px] text-slate-200 placeholder:text-slate-600
                  focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>
          </div>

          {/* 空间列表 */}
          <div className="px-3 pb-3">
            {filteredSpaces.map((community) => {
              const isChecked = selected.includes(community.id);
              const Icon = TYPE_ICON[community.type];
              const grad = TYPE_GRADIENT[community.type];
              const initials = community.name.slice(0, 2).toUpperCase();

              return (
                <button
                  key={community.id}
                  onClick={() => toggleSpace(community.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                    ${isChecked ? "bg-blue-600/12" : "hover:bg-white/5"}`}
                >
                  {/* 头像 */}
<div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white bg-gradient-to-br ${grad} shrink-0`}>
                      {community.avatarUrl && community.avatarUrl !== "string"
                        ? <img src={community.avatarUrl} className="w-full h-full object-cover rounded-[inherit]" alt={community.name} />
                      : initials
                    }
                  </div>

                  {/* 文字 */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-medium text-slate-200 truncate">{community.name}</p>
                    <p className="text-[11px] text-slate-500">{TYPE_LABEL[community.type]}</p>
                  </div>

                  {/* 勾选框 */}
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
                    transition-all
                    ${isChecked
                      ? "bg-blue-500 border-blue-500"
                      : "border-slate-600 bg-transparent"
                    }`}>
                    {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
            {filteredSpaces.length === 0 && (
              <p className="text-center text-[13px] text-slate-600 py-4">没有找到匹配的空间</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/6 flex items-center gap-3">
          {/* 删除（仅编辑模式 + 非系统文件夹） */}
          {!isNew && !folder?.isSystem && onDelete && (
            <button
              onClick={() => { onDelete(folder!.id); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-red-400
                hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 text-[13px] text-slate-400 hover:text-white
              hover:bg-white/8 rounded-xl transition-all">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className="px-5 py-2 text-[13px] font-bold bg-blue-600 hover:bg-blue-500
              text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isNew ? "创建" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}