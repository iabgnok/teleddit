"use client";
// components/post/LinkPreviewCard.tsx
// 链接类型帖文的预览卡片，支持 compact（内嵌在 Feed）和 full（PostModal 内）两种尺寸

import { ExternalLink, Globe } from "lucide-react";

interface LinkMeta {
  title: string;
  description?: string;
  image?: string;
  domain: string;
  favicon?: string;
}

interface LinkPreviewCardProps {
  url: string;
  meta: LinkMeta;
  size?: "compact" | "full";
  onClick?: (e: React.MouseEvent) => void;
}

export default function LinkPreviewCard({
  url,
  meta,
  size = "compact",
  onClick,
}: LinkPreviewCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (size === "full") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="block rounded-2xl overflow-hidden border border-white/8 bg-[#161616]
          hover:border-blue-500/40 hover:bg-[#1a1a1a] transition-all group"
      >
        {meta.image && (
          <div className="w-full aspect-[2/1] overflow-hidden bg-black/30">
            <img
              src={meta.image}
              alt={meta.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          {/* Domain 行 */}
          <div className="flex items-center gap-2 mb-2">
            {meta.favicon ? (
              <img src={meta.favicon} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Globe size={14} className="text-slate-500 shrink-0" />
            )}
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider truncate">
              {meta.domain}
            </span>
            <ExternalLink size={12} className="ml-auto text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
          </div>
          <p className="text-[15px] font-bold text-white leading-snug mb-1.5 line-clamp-2">
            {meta.title}
          </p>
          {meta.description && (
            <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
              {meta.description}
            </p>
          )}
        </div>
      </a>
    );
  }

  // compact 模式：横向布局，适合 Feed 卡片内嵌
  return (
    <button
      onClick={handleClick}
      className="w-full flex items-stretch rounded-xl overflow-hidden border border-white/8
        bg-[#161616] hover:border-blue-500/30 hover:bg-[#1b1b1b] transition-all text-left group"
    >
      {/* 左侧色条 */}
      <div className="w-1 shrink-0 bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />

      {/* 文字区 */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          {meta.favicon ? (
            <img src={meta.favicon} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <Globe size={12} className="text-slate-500 shrink-0" />
          )}
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
            {meta.domain}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2 mb-0.5">
          {meta.title}
        </p>
        {meta.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
            {meta.description}
          </p>
        )}
      </div>

      {/* 右侧缩略图 */}
      {meta.image && (
        <div className="w-20 shrink-0 overflow-hidden">
          <img
            src={meta.image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
    </button>
  );
}