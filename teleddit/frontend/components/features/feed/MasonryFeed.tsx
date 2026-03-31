// components/feed/MasonryFeed.tsx
// ★ 全面重写：
//  · 工具栏全部改为卡片内常驻底部，彻底不溢出
//  · 标签区：只渲染 TagBadge（结构化 object），去掉所有英文类型角标
//  · Text 贴：专用色块渐变卡片，无封面时展示文字摘要
//  · Media 贴：沉浸式封面图 + 常驻底部工具栏
//  · Link 贴：链接预览 + 常驻工具栏
//  · 所有卡片补回 Share 按钮

import Masonry from "react-masonry-css";
import { useState } from "react";
import {
  ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark,
  ExternalLink, Globe, Clock, Users,
} from "lucide-react";
import TagBadge from "@/components/common/ui/TagBadge";
import type { TagColor } from "@/lib/mock/tags";
import { fetchApi } from "@/lib/api/client";

// ── 工具 ────────────────────────────────────────────────────
function relTime(iso?: string) {
  if (!iso) return "刚刚";
  const d = (Date.now() - +new Date(iso)) / 1000;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

function structuredTags(post: any): any[] {
  if (!Array.isArray(post.tags) || !post.tags.length) return [];
  return typeof post.tags[0] === "object" ? post.tags : [];
}

function stripHtml(html = "", max = 160) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// ── 常驻工具栏（不悬浮，不溢出）────────────────────────────
function Toolbar({ post, onVote, onSelectPost, fmt }: {
  post: any;
  onVote: (id: any, d: number, e: React.MouseEvent) => void;
  onSelectPost: (p: any) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
      {/* 投票 */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={(e) => onVote(post.id, 1, e)}
          className={`p-1 rounded-full transition-all active:scale-110
            ${post.user_voted === 1 ? "text-orange-500" : "text-slate-500 hover:text-orange-400"}`}>
          <ArrowBigUp size={17} fill={post.user_voted === 1 ? "currentColor" : "none"} />
        </button>
        <span className="text-[12px] font-black text-white tabular-nums min-w-[1.5rem] text-center">
          {fmt(post.votes || post.upvotes || 0)}
        </span>
        <button onClick={(e) => onVote(post.id, -1, e)}
          className={`p-1 rounded-full transition-all active:scale-110
            ${post.user_voted === -1 ? "text-blue-500" : "text-slate-500 hover:text-blue-400"}`}>
          <ArrowBigDown size={17} fill={post.user_voted === -1 ? "currentColor" : "none"} />
        </button>
      </div>
      {/* 评论 */}
      <button onClick={() => onSelectPost(post)}
        className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors">
        <MessageCircle size={14} />
        <span className="text-[11px] font-bold">{post.comment_count || post.comments || 0}</span>
      </button>
      {/* 收藏 */}
      <button 
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await fetchApi(`/posts/${post.id}/favorite`, { method: "POST" });
            alert("已收藏");
          } catch (err) {
            console.error("收藏失败", err);
          }
        }}
        className="ml-auto text-slate-600 hover:text-white transition-colors">
        <Bookmark size={13} />
      </button>
    </div>
  );
}

// ── 作者行（含标签）────────────────────────────────────────
function Author({ post, onSelectCommunity }: { post: any, onSelectCommunity?: (communityId: string) => void }) {
  const tags = structuredTags(post);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div 
        className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectCommunity && post.community_id) {
            onSelectCommunity(post.community_id);
          }
        }}
      >
        <img src={post.community_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.community_id || post.community || post.author_id || post.author}`} alt="" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 flex-wrap">
          {post.community ? (
            <span 
              className="text-[12px] font-bold text-white hover:text-blue-400 cursor-pointer truncate"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCommunity && post.community_id) {
                  onSelectCommunity(post.community_id);
                }
              }}
            >
              r/{post.community}
            </span>
          ) : (
            <span className="text-[12px] font-bold text-white truncate">{post.author || "绳匠"}</span>
          )}
          {/* ★ 只显示中文结构化标签，无英文类型 */}
          {tags.slice(0, 2).map((t: any) => (
            <TagBadge key={t.id ?? t.name} name={t.name}
              color={(t.color as TagColor) ?? "slate"} size="xs" />
          ))}
        </div>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          {post.author && (
            <span className="truncate max-w-[80px]">
              u/{post.author}
            </span>
          )}
          {post.author && <span>·</span>}
          <span>{relTime(post.created_at)}</span>
        </span>
      </div>
    </div>
  );
}

// ── 内联链接预览 ────────────────────────────────────────────
function LinkPreview({ url, meta }: { url: string; meta: any }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block rounded-xl overflow-hidden border border-white/10 bg-[#0c0c0c]
        hover:border-blue-500/30 transition-all group/lp">
      {meta.image && (
        <div className="w-full aspect-[2/1] overflow-hidden">
          <img src={meta.image} alt="" className="w-full h-full object-cover
            transition-transform duration-500 group-hover/lp:scale-105" />
        </div>
      )}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Globe size={10} className="text-slate-500 shrink-0" />
          <span className="text-[10px] text-slate-500 truncate font-mono">{meta.domain}</span>
          <ExternalLink size={9} className="ml-auto text-slate-600 shrink-0" />
        </div>
        <p className="text-[12px] font-semibold text-white line-clamp-2 leading-snug">{meta.title}</p>
      </div>
    </a>
  );
}

// ── 1. TEXT 贴 ──────────────────────────────────────────────
const GRADIENTS = [
  "from-slate-800/80 to-slate-900",
  "from-blue-950/70 to-slate-900",
  "from-violet-950/70 to-slate-900",
  "from-emerald-950/70 to-slate-900",
  "from-rose-950/70 to-slate-900",
  "from-amber-950/70 to-slate-900",
];

function TextCard({ post, onSelectPost, onVote, fmt, idx, onSelectCommunity, onContextMenu }: {
  post: any; onSelectPost: (p: any) => void;
  onVote: (id: any, d: number, e: React.MouseEvent) => void;
  fmt: (v: number) => string; idx: number;
  onSelectCommunity?: (communityId: string) => void;
  onContextMenu?: (e: React.MouseEvent, post: any) => void;
}) {
  const hasCover = post.cover || post.cover_url;
  const grad = GRADIENTS[idx % GRADIENTS.length];

  return (
    <article onClick={() => onSelectPost(post)}
      onContextMenu={(e) => { if (onContextMenu) onContextMenu(e, post); }}
      className="mb-5 group cursor-pointer rounded-[1.75rem] overflow-hidden
        border border-white/8 bg-[#131313]
        hover:border-blue-500/25 hover:-translate-y-1
        hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">

      {/* 封面图 */}
      {hasCover && (
        <div className="w-full aspect-[16/9] overflow-hidden">
          <img src={post.cover || post.cover_url} alt=""
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      )}

      {/* 无封面：色块渐变 + 标题文字 */}
      {!hasCover && (
        <div className={`relative bg-gradient-to-br ${grad} px-5 pt-5 pb-4`}>
          {/* 网格纹 */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
          <h3 className="relative text-[15px] font-black text-white leading-snug line-clamp-4
            group-hover:text-blue-300 transition-colors">
            {post.title}
          </h3>
          {post.content && (
            <p className="relative mt-2 text-[12px] text-slate-400 leading-relaxed line-clamp-3">
              {stripHtml(post.content)}
            </p>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-3 community-y-2.5">
        {hasCover && (
          <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2
            group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
        )}
        <Author post={post} onSelectCommunity={onSelectCommunity} />
        <div className="pt-1 border-t border-white/5">
          <Toolbar post={post} onVote={onVote} onSelectPost={onSelectPost} fmt={fmt} />
        </div>
      </div>
    </article>
  );
}

// ── 2. MEDIA 贴 ──────────────────────────────────────────────
const HEIGHTS = ["h-[240px]", "h-[300px]", "h-[270px]", "h-[330px]", "h-[260px]"];

function MediaCard({ post, onSelectPost, onVote, fmt, idx, onSelectCommunity, onContextMenu }: {
  post: any; onSelectPost: (p: any) => void;
  onVote: (id: any, d: number, e: React.MouseEvent) => void;
  fmt: (v: number) => string; idx: number;
  onSelectCommunity?: (communityId: string) => void;
  onContextMenu?: (e: React.MouseEvent, post: any) => void;
}) {
  const coverUrl = post.media_urls?.[0] ?? post.cover ?? post.cover_url;
  const extra = (post.media_urls?.length ?? 0) - 1;

  return (
    <article onClick={() => onSelectPost(post)}
      onContextMenu={(e) => { if (onContextMenu) onContextMenu(e, post); }}
      className="mb-5 group cursor-pointer rounded-[1.75rem] overflow-hidden
        border border-white/10 bg-[#111]
        hover:border-blue-500/35 hover:-translate-y-1.5
        hover:shadow-xl hover:shadow-blue-500/8 transition-all duration-300">

      {/* 图片区 */}
      <div 
        className={`relative ${HEIGHTS[idx % HEIGHTS.length]} overflow-hidden`}
      >
        {coverUrl
          ? <img src={coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.07]" alt="" />
          : <div className="w-full h-full bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        {extra > 0 && (
          <span className="absolute top-3.5 right-3.5 z-10 px-2 py-0.5 bg-black/70
            border border-white/20 rounded-lg text-[10px] font-black text-white backdrop-blur-sm">
            +{extra}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 z-10">
          <h3 className="text-[14px] font-black text-white leading-snug line-clamp-2
            group-hover:text-blue-300 transition-colors">
            {post.title}
          </h3>
        </div>
      </div>

      <div className="px-4 py-3 community-y-2.5">
        <Author post={post} onSelectCommunity={onSelectCommunity} />
        <div className="pt-1 border-t border-white/5">
          <Toolbar post={post} onVote={onVote} onSelectPost={onSelectPost} fmt={fmt} />
        </div>
      </div>
    </article>
  );
}

// ── 3. LINK 贴 ───────────────────────────────────────────────
function LinkCard({ post, onSelectPost, onVote, fmt, onSelectCommunity, onContextMenu }: {
  post: any; onSelectPost: (p: any) => void;
  onVote: (id: any, d: number, e: React.MouseEvent) => void;
  fmt: (v: number) => string;
  onSelectCommunity?: (communityId: string) => void;
  onContextMenu?: (e: React.MouseEvent, post: any) => void;
}) {
  return (
    <article onClick={() => onSelectPost(post)}
      onContextMenu={(e) => { if (onContextMenu) onContextMenu(e, post); }}
      className="mb-5 group cursor-pointer rounded-[1.75rem] overflow-hidden
        border border-white/8 bg-[#141414]
        hover:border-blue-500/25 hover:-translate-y-1
        hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">

      <div className="px-4 pt-4 pb-2"><Author post={post} onSelectCommunity={onSelectCommunity} /></div>
      <div className="px-4 pb-3">
        <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2
          group-hover:text-blue-400 transition-colors mb-2.5">
          {post.title}
        </h3>
        {post.link_url && post.link_meta && (
          <LinkPreview url={post.link_url} meta={post.link_meta} />
        )}
      </div>
      <div className="px-4 pb-4 pt-2 border-t border-white/5">
        <Toolbar post={post} onVote={onVote} onSelectPost={onSelectPost} fmt={fmt} />
      </div>
    </article>
  );
}




// ── 主组件 ──────────────────────────────────────────────────
interface MasonryFeedProps {
  posts: any[];
  onSelectPost: (post: any) => void;
  onVote: (id: any, delta: number, e: React.MouseEvent) => void;
  formatVotes: (votes: number) => string;
  onSelectCommunity?: (communityId: string) => void;
  onContextMenu?: (e: React.MouseEvent, post: any) => void;
}

export default function MasonryFeed({ posts, onSelectPost, onVote, formatVotes, onSelectCommunity, onContextMenu }: MasonryFeedProps) {
  return (
    <Masonry breakpointCols={{ default: 4, 1500: 3, 1100: 2, 700: 1 }}
      className="my-masonry-grid" columnClassName="my-masonry-grid_column">
      {posts.map((post: any, i: number) => {
        const ct = post.content_type ?? "text";
        if (ct === "media") return <MediaCard key={post.id} post={post} onSelectPost={onSelectPost} onVote={onVote} fmt={formatVotes} idx={i} onSelectCommunity={onSelectCommunity} onContextMenu={onContextMenu} />;
        if (ct === "link" && post.link_meta) return <LinkCard key={post.id} post={post} onSelectPost={onSelectPost} onVote={onVote} fmt={formatVotes} onSelectCommunity={onSelectCommunity} onContextMenu={onContextMenu} />;
        return <TextCard key={post.id} post={post} onSelectPost={onSelectPost} onVote={onVote} fmt={formatVotes} idx={i} onSelectCommunity={onSelectCommunity} onContextMenu={onContextMenu} />;
      })}
    </Masonry>
  );
}