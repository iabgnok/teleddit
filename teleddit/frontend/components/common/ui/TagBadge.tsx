"use client";
// components/post/TagBadge.tsx
// 可复用的标签徽章：用于 Feed 卡片、PostModal、ChatBubble、FilterBar
// size: "xs" | "sm" | "md"
// variant: "filled"（填充）| "outline"（描边）| "ghost"（最淡）

import type { TagColor } from "@/lib/mock/tags";

// ── 色值 map ─────────────────────────────────────────────────
const COLOR_MAP: Record<
  TagColor,
  { filled: string; outline: string; ghost: string; dot: string }
> = {
  blue: {
    filled:  "bg-blue-500/20 text-blue-300 border-blue-500/40",
    outline: "bg-transparent text-blue-400 border-blue-500/50 hover:bg-blue-500/10",
    ghost:   "bg-blue-500/8 text-blue-400/70 border-transparent",
    dot:     "bg-blue-400",
  },
  purple: {
    filled:  "bg-purple-500/20 text-purple-300 border-purple-500/40",
    outline: "bg-transparent text-purple-400 border-purple-500/50 hover:bg-purple-500/10",
    ghost:   "bg-purple-500/8 text-purple-400/70 border-transparent",
    dot:     "bg-purple-400",
  },
  emerald: {
    filled:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    outline: "bg-transparent text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/10",
    ghost:   "bg-emerald-500/8 text-emerald-400/70 border-transparent",
    dot:     "bg-emerald-400",
  },
  orange: {
    filled:  "bg-orange-500/20 text-orange-300 border-orange-500/40",
    outline: "bg-transparent text-orange-400 border-orange-500/50 hover:bg-orange-500/10",
    ghost:   "bg-orange-500/8 text-orange-400/70 border-transparent",
    dot:     "bg-orange-400",
  },
  rose: {
    filled:  "bg-rose-500/20 text-rose-300 border-rose-500/40",
    outline: "bg-transparent text-rose-400 border-rose-500/50 hover:bg-rose-500/10",
    ghost:   "bg-rose-500/8 text-rose-400/70 border-transparent",
    dot:     "bg-rose-400",
  },
  yellow: {
    filled:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    outline: "bg-transparent text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10",
    ghost:   "bg-yellow-500/8 text-yellow-400/70 border-transparent",
    dot:     "bg-yellow-400",
  },
  cyan: {
    filled:  "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    outline: "bg-transparent text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/10",
    ghost:   "bg-cyan-500/8 text-cyan-400/70 border-transparent",
    dot:     "bg-cyan-400",
  },
  slate: {
    filled:  "bg-slate-500/20 text-slate-300 border-slate-500/40",
    outline: "bg-transparent text-slate-400 border-slate-500/40 hover:bg-slate-500/10",
    ghost:   "bg-slate-500/8 text-slate-400/70 border-transparent",
    dot:     "bg-slate-400",
  },
  violet: {
    filled:  "bg-violet-500/20 text-violet-300 border-violet-500/40",
    outline: "bg-transparent text-violet-400 border-violet-500/50 hover:bg-violet-500/10",
    ghost:   "bg-violet-500/8 text-violet-400/70 border-transparent",
    dot:     "bg-violet-400",
  },
  amber: {
    filled:  "bg-amber-500/20 text-amber-300 border-amber-500/40",
    outline: "bg-transparent text-amber-400 border-amber-500/50 hover:bg-amber-500/10",
    ghost:   "bg-amber-500/8 text-amber-400/70 border-transparent",
    dot:     "bg-amber-400",
  },
};

const SIZE_MAP = {
  xs: { pill: "px-1.5 py-0.5 text-[9px] gap-1",    dot: "w-1.5 h-1.5" },
  sm: { pill: "px-2 py-0.5 text-[10px] gap-1",      dot: "w-1.5 h-1.5" },
  md: { pill: "px-2.5 py-1 text-[12px] gap-1.5",    dot: "w-2 h-2"     },
};

interface TagBadgeProps {
  name: string;
  color: TagColor;
  size?: "xs" | "sm" | "md";
  variant?: "filled" | "outline" | "ghost";
  showDot?: boolean;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export default function TagBadge({
  name,
  color,
  size = "sm",
  variant = "filled",
  showDot = true,
  onClick,
  active = false,
  className = "",
}: TagBadgeProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
  const s = SIZE_MAP[size];
  const variantClass = active ? c.filled : c[variant];

  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      onClick={onClick}
      className={`
        inline-flex items-center font-bold rounded-full border
        transition-all duration-150 select-none
        ${s.pill} ${variantClass}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {showDot && (
        <span className={`rounded-full shrink-0 ${s.dot} ${c.dot}`} />
      )}
      {name}
    </Tag>
  );
}