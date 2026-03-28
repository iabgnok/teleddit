"use client";

// ════════════════════════════════════════════════════════════════════════
// 📌 固定入口组件 (PinnedItem)
// 负责渲染侧边栏顶部的固定入口，如“首页”、“已收藏”等
// ════════════════════════════════════════════════════════════════════════

interface PinnedItemProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  gradient: string;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function PinnedItem({
  icon,
  label,
  desc,
  gradient,
  isActive,
  onClick,
  onContextMenu,
}: PinnedItemProps) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer select-none
        transition-colors duration-100 border-l-2
        ${isActive ? "bg-white/8 border-blue-500" : "hover:bg-white/5 border-transparent"}`}
    >
      {/* 渐变图标背景 */}
      <div className={`w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br ${gradient}
        flex items-center justify-center shadow-md`}>
        {icon}
      </div>
      
      {/* 文本信息 */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-slate-200 block">{label}</span>
        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
