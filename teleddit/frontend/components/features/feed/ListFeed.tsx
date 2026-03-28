// components/feed/ListFeed.tsx
// ★ 标签兼容 string[] 和 object[]；Text贴文字摘要优先；工具栏常驻

import { MoreHorizontal, ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark } from "lucide-react";
import LinkPreviewCard from "@/components/features/post/LinkPreviewCard";
import TagBadge from "@/components/common/ui/TagBadge";
import type { TagColor } from "@/lib/mock/tags";
import { fetchApi } from "@/lib/api/client";

interface ListFeedProps {
  posts: any[];
  onSelectPost: (post: any) => void;
  onVote: (id: any, delta: number, e: React.MouseEvent) => void;
  formatVotes: (votes: number) => string;
  onSelectCommunity?: (communityId: string) => void;
  onContextMenu?: (e: React.MouseEvent, post: any) => void;
}

function relTime(iso?: string) {
  if (!iso) return "刚刚";
  const d = (Date.now() - +new Date(iso)) / 1000;
  if (d < 60) return "刚刚";
  if (d < 3600) return `${Math.floor(d / 60)} 分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小时前`;
  return `${Math.floor(d / 86400)} 天前`;
}

function stripHtml(html = "", max = 220) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// 兼容 string 和 object 两种 tag 格式
function TagList({ post, max = 3 }: { post: any; max?: number }) {
  const raw: any[] = Array.isArray(post.tags) ? post.tags : [];
  if (!raw.length) return null;
  const shown = raw.slice(0, max);
  const rest = raw.length - max;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((t: any, i: number) =>
        typeof t === "string"
          ? <TagBadge key={i} name={t} color="slate" size="xs" showDot={false} />
          : <TagBadge key={t.id ?? i} name={t.name} color={(t.color as TagColor) ?? "slate"} size="xs" />
      )}
      {rest > 0 && <span className="text-[10px] text-slate-600 font-bold">+{rest}</span>}
    </div>
  );
}

function MediaGrid({ urls }: { urls: string[] }) {
  const shown = urls.slice(0, 4);
  const rest = urls.length - 4;

  if (shown.length === 1) return (
    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer">
      <img src={shown[0]} alt="" className="w-full h-full object-cover" />
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
      {shown.map((url, i) => (
        <div key={i} className="relative aspect-square overflow-hidden cursor-pointer">
          <img src={url} alt="" className="w-full h-full object-cover" />
          {i === 3 && rest > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-black">+{rest}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ListFeed({ posts, onSelectPost, onVote, formatVotes, onSelectCommunity, onContextMenu }: ListFeedProps) {
  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      {posts.map((post: any) => {
        const ct: string = post.content_type ?? "text";

        return (
          <article key={post.id} onClick={() => onSelectPost(post)}
            onContextMenu={(e) => {
              // @ts-ignore
              if (typeof onContextMenu !== 'undefined' && onContextMenu) {
                // @ts-ignore
                onContextMenu(e, post);
              }
            }}
            className="bg-[#121212] rounded-[2rem] border border-white/5 overflow-hidden
              cursor-pointer hover:bg-[#161616] hover:border-white/10 transition-all group">

            {/* 头部 */}
            <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_id || post.author}`} alt="" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-white">{post.author || "绳匠"}</span>
                    {/* 标签显示在作者名旁 */}
                    <TagList post={post} max={3} />
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                    {post.community && (
                      <span 
                        className="hover:text-blue-400 hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCommunity && post.community_id) {
                            onSelectCommunity(post.community_id);
                          }
                        }}
                      >
                        r/{post.community}
                      </span>
                    )}
                    {post.community && <span>·</span>}
                    <span>{relTime(post.created_at)}</span>
                  </p>
                </div>
              </div>
              <MoreHorizontal size={15} className="text-slate-600 hover:text-slate-400 shrink-0 mt-1" />
            </div>

            {/* 标题 */}
            <div className="px-5 pb-2">
              <h3 className="text-[16px] font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">
                {post.title}
              </h3>
            </div>

            {/* 内容 */}
            <div className="px-5 pb-3">
              {ct === "text" && (
                <>
                  {post.content && (
                    <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-3 mb-3">
                      {stripHtml(post.content)}
                    </p>
                  )}
                  {(post.cover || post.cover_url) && (
                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer">
                      <img src={post.cover || post.cover_url} alt="cover"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                </>
              )}
              {ct === "media" && (
                <>
                  {post.media_urls?.length > 0
                    ? <MediaGrid urls={post.media_urls} />
                    : (post.cover || post.cover_url) && (
                      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer">
                        <img src={post.cover || post.cover_url} alt="cover"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                  {post.content && (
                    <p className="text-[12px] text-slate-500 mt-2 line-clamp-1">{stripHtml(post.content, 100)}</p>
                  )}
                </>
              )}
              {ct === "link" && post.link_url && post.link_meta && (
                <div onClick={(e) => e.stopPropagation()}>
                  <LinkPreviewCard url={post.link_url} meta={post.link_meta} size="compact" />
                </div>
              )}
              
            </div>

            {/* 常驻工具栏 */}
            <div className="px-4 pb-3 pt-0.5 border-t border-white/5 flex items-center gap-2.5 flex-wrap"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center bg-white/5 rounded-full px-1 py-0.5 border border-white/5 shrink-0">
                <button onClick={(e) => onVote(post.id, 1, e)}
                  className={`p-1.5 rounded-full transition-all active:scale-125
                    ${post.user_voted === 1 ? "text-orange-500" : "text-slate-400 hover:text-orange-500"}`}>
                  <ArrowBigUp size={18} fill={post.user_voted === 1 ? "currentColor" : "none"} />
                </button>
                <span className="px-1 text-[12px] font-black min-w-[2rem] text-center text-white tabular-nums">
                  {formatVotes(post.votes || post.upvotes || 0)}
                </span>
                <button onClick={(e) => onVote(post.id, -1, e)}
                  className={`p-1.5 rounded-full transition-all active:scale-125
                    ${post.user_voted === -1 ? "text-blue-500" : "text-slate-400 hover:text-blue-500"}`}>
                  <ArrowBigDown size={18} fill={post.user_voted === -1 ? "currentColor" : "none"} />
                </button>
              </div>
              <button onClick={() => onSelectPost(post)}
                className="flex items-center gap-1.5 bg-white/5 px-3.5 py-2 rounded-full
                  text-[12px] font-bold text-slate-300 border border-white/5
                  hover:bg-white/10 transition-colors shrink-0">
                <MessageCircle size={14} />
                {post.comments || post.comment_count || 0}
              </button>
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
                className="ml-auto p-2 text-slate-600 hover:text-white transition-colors">
                <Bookmark size={14} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}