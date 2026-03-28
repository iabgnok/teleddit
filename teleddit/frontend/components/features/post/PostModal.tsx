"use client";
// components/modals/PostModal.tsx
// ★ 重写要点：
//   · 左侧按 content_type 分支渲染
//   · Text 贴：纯富文本 HTML（tiptap-render），图片/视频按编辑器位置内联显示
//            点击内联图片/视频 → 调用 MediaViewer
//   · Media 贴：顶部图片画廊（左右箭头 + 缩略图条），视频用原生播放器
//             点击任意图片 → MediaViewer 全屏
//   · Link 贴：链接预览 + 访问按钮
//   · 标签显示（兼容 string 和 object）
//   · 右侧评论区：原样保留

import { useState, useEffect, useRef } from "react";
import {
  X, ShieldAlert, ArrowBigUp, Loader2, ArrowBigDown,
  Minus, Plus, ChevronLeft, ChevronRight,
  Globe, ExternalLink, Clock, Users, Play,
} from "lucide-react";
import StyledTelegramInput from "@/components/features/chat/input/ChatInput";
import TagBadge from "@/components/common/ui/TagBadge";
import type { TagColor } from "@/lib/mock/tags";
import { useMediaViewer } from "@/components/common/media/MediaViewerContext";
import { fetchApi } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

// Mock MediaItem for now
export type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  videoTitle?: string;
};

// ── 标签列表 ────────────────────────────────────────────────
function TagList({ post }: { post: any }) {
  const raw: any[] = Array.isArray(post.tags) ? post.tags : [];
  if (!raw.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {raw.map((t: any, i: number) =>
        typeof t === "string"
          ? <TagBadge key={i} name={t} color="slate" size="sm" showDot={false} />
          : <TagBadge key={t.id ?? i} name={t.name} color={(t.color as TagColor) ?? "slate"} size="sm" />
      )}
    </div>
  );
}

// ── 构建 MediaItem 列表 ──────────────────────────────────────
function buildMediaItems(urls: string[]): MediaItem[] {
  return urls.map((url, i) => ({
    id: String(i),
    type: /\.(mp4|webm|mov|avi)$/i.test(url) ? "video" : "image",
    url,
    thumbnailUrl: url,
  }));
}

// ── 媒体画廊（Media 贴顶部）──────────────────────────────────
function MediaGallery({ post }: { post: any }) {
  const [cur, setCur] = useState(0);
  const viewer = useMediaViewer();

  const urls: string[] = post.media_urls?.length
    ? post.media_urls
    : (post.cover_url || post.cover ? [post.cover_url || post.cover] : []);

  if (!urls.length) return null;

  const mediaItems = buildMediaItems(urls);
  const curUrl = urls[cur];
  const isVideo = /\.(mp4|webm|mov|avi)$/i.test(curUrl);

  const openViewer = (startIdx: number) => {
    viewer.open({
      mediaList: mediaItems.map(item => ({
        id: item.id,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl
      })),
      initialIndex: startIdx,
      senderName: post.author || "User",
      timestamp: new Date(post.created_at || Date.now()).toLocaleString()
    });
  };

  return (
    <div className="relative w-full bg-[#050505] border-b border-white/5">
      {/* 主展示区 */}
      <div className="relative w-full flex items-center justify-center"
        style={{ minHeight: 300 }}>
        {isVideo ? (
          <video src={curUrl} controls
            className="w-full max-h-[55vh] object-contain" />
        ) : (
          <img src={curUrl} alt=""
            onClick={() => openViewer(cur)}
            className="w-full max-h-[55vh] object-contain cursor-zoom-in" />
        )}

        {/* 左右切换 */}
        {urls.length > 1 && (
          <>
            <button onClick={() => setCur(c => (c - 1 + urls.length) % urls.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60
                hover:bg-black/80 border border-white/15 rounded-full
                flex items-center justify-center text-white transition-all z-10">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCur(c => (c + 1) % urls.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60
                hover:bg-black/80 border border-white/15 rounded-full
                flex items-center justify-center text-white transition-all z-10">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* 缩略图条 */}
      {urls.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {urls.map((u, i) => {
            const isVid = /\.(mp4|webm|mov|avi)$/i.test(u);
            return (
              <button key={i} onClick={() => setCur(i)}
                className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all relative
                  ${i === cur ? "border-blue-500 opacity-100" : "border-white/10 opacity-50 hover:opacity-80"}`}>
                {isVid ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Play size={16} className="text-white/70" />
                  </div>
                ) : (
                  <img src={u} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 富文本渲染区（Text 贴）────────────────────────────────────
// 注入点击事件：点击 img 或 .tiptap-video-wrapper → 打开 MediaViewer
function RichContent({ html, post }: { html: string; post: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useMediaViewer();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 收集所有图片 URL（用于 MediaViewer 多图浏览）
    const imgs = Array.from(el.querySelectorAll("img"));
    const imgUrls = imgs.map(img => img.src).filter(Boolean);
    const imgItems: MediaItem[] = imgUrls.map((url, i) => ({
      id: `img-${i}`, type: "image", url, thumbnailUrl: url,
    }));

    // 图片点击 → MediaViewer
    imgs.forEach((img, idx) => {
      img.style.cursor = "zoom-in";
      const handler = () => {
        viewer.open({
          mediaList: imgItems.map(item => ({
            id: item.id,
            type: item.type as "image" | "video",
            url: item.url,
            thumbnailUrl: item.thumbnailUrl
          })),
          initialIndex: idx,
          senderName: post.author || "User",
          timestamp: new Date(post.created_at || Date.now()).toLocaleString()
        });
      };
      img.addEventListener("click", handler);
      return () => img.removeEventListener("click", handler);
    });

    // iframe 视频包裹容器 — 不拦截，让 iframe 正常交互
    // （如需点击打开全屏，可在此处理）
  }, [html, post, viewer]);

  return (
    <div
      ref={ref}
      className="tiptap-render"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}



// ── 评论子组件（原样保留）────────────────────────────────────
const CommentItem = ({
  comment, currentUser, postAuthorId, onReply, onDelete, onVote,
}: {
  comment: any; currentUser: any; postAuthorId: string;
  onReply: (c: any) => void; onDelete: (id: string) => void; onVote: (id: string, t: number) => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="relative animate-in slide-in-from-left-1 duration-300">
      <div className="group/comment relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {isCollapsed && (
              <button onClick={() => setIsCollapsed(false)}
                className="flex items-center justify-center w-5 h-5 rounded-md
                  bg-blue-500/20 border border-blue-500/30 text-blue-400
                  hover:bg-blue-500/40 hover:scale-110 transition-all -ml-1">
                <Plus size={12} strokeWidth={4} />
              </button>
            )}
            <span className="text-blue-500 font-bold text-[11px] italic">
              @ {comment.profiles?.username || "空洞绳匠"}
            </span>
            <span className="text-slate-600 text-[9px] font-mono">
              {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isCollapsed && (
              <span className="text-[10px] text-slate-500 italic opacity-60">数据已压缩...</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200">
              <button onClick={() => onReply(comment)}
                className="text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-tighter">Reply</button>
              {(currentUser?.id === comment.author_id || currentUser?.id === postAuthorId) && (
                <button onClick={() => onDelete(comment.id)}
                  className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-tighter">Delete</button>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="relative bg-white/[0.02] p-3 rounded-xl border border-white/5
            group-hover/comment:border-white/20 group-hover/comment:bg-white/[0.04]
            transition-all duration-300 mb-2">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            <div className="absolute -right-2 -bottom-3 flex items-center opacity-0
              group-hover/comment:opacity-100 transition-all duration-300 z-10">
              <div className="flex items-center gap-0.5 bg-[#1b1b1b] px-2 py-0.5 rounded-full border border-white/20 shadow-xl shadow-black/80">
                <button onClick={() => onVote(comment.id, 1)}
                  className={`p-0.5 ${comment.user_voted === 1 ? "text-blue-500" : "text-slate-500 hover:text-blue-400"}`}>
                  <ArrowBigUp size={16} fill={comment.user_voted === 1 ? "currentColor" : "none"} />
                </button>
                <span className="text-[10px] font-mono font-black min-w-[12px] text-center text-slate-400">{comment.vote_count || 0}</span>
                <button onClick={() => onVote(comment.id, -1)}
                  className={`p-0.5 ${comment.user_voted === -1 ? "text-orange-500" : "text-slate-500 hover:text-orange-400"}`}>
                  <ArrowBigDown size={16} fill={comment.user_voted === -1 ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {!isCollapsed && comment.children?.length > 0 && (
        <div className="ml-[8px] pl-5 mt-2 relative group/thread">
          <div onClick={() => setIsCollapsed(true)}
            className="absolute left-0 top-0 bottom-0 w-5 cursor-pointer group/line z-10">
            <div className="absolute inset-y-0 left-0 w-[2px] bg-white/5 group-hover/line:bg-blue-500/50 transition-all duration-300" />
            <div className="absolute -left-[9px] top-0 opacity-0 group-hover/line:opacity-100 transition-all duration-200 scale-75 group-hover/line:scale-100">
              <div className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-600 shadow-lg shadow-blue-900/40 text-white">
                <Minus size={12} strokeWidth={4} />
              </div>
            </div>
          </div>
          <div className="space-y-6 pt-1">
            {comment.children.map((child: any) => (
              <CommentItem key={child.id} comment={child} currentUser={currentUser}
                postAuthorId={postAuthorId} onReply={onReply} onDelete={onDelete} onVote={onVote} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── 主组件 ──────────────────────────────────────────────────
interface PostModalProps {
  post: any;
  onClose: () => void;
  onCommentCountChange?: (postId: string, delta: number) => void;
}

export default function PostModal({ post, onClose, onCommentCountChange }: PostModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { user } = useAuth(); // 从 AuthContext 获取真实用户

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => { if (post?.id) fetchComments(); }, [post?.id]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await fetchApi<any[]>(`/posts/${post.id}/comments`, { requireAuth: false });
      setComments(data || []);
    } catch {}
    finally { setIsLoadingComments(false); }
  };

  const handleSend = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetchApi(`/posts/${post.id}/comments`, {
        method: "POST", 
        body: JSON.stringify({ content: newComment, parent_id: replyTo?.id || null }),
      });
      setNewComment(""); setReplyTo(null);
      onCommentCountChange?.(String(post.id), 1);
      fetchComments();
    } catch (err: any) {
      alert(`评论失败: ${err.message || "未知错误"}`);
    }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("确定要删除吗？")) return;
    try {
      await fetchApi(`/posts/${post.id}/comments/${id}`, { method: "DELETE" });
      fetchComments(); 
      onCommentCountChange?.(String(post.id), -1);
    } catch (err: any) {
      alert(`删除失败: ${err.message || "未知错误"}`);
    }
  };

  const handleCommentVote = async (id: string, voteType: number) => {
    try {
      await fetchApi(`/posts/${post.id}/comments/${id}/vote`, {
        method: "POST", 
        body: JSON.stringify({ vote_type: voteType }),
      });
      fetchComments();
    } catch (err: any) {
       alert(`投票失败: ${err.message || "未知错误"}`);
    }
  };

  if (!post) return null;

  // content_type 判断
  const ct: string = post.content_type ?? (
    post.cover_url || post.cover ? "media" : "text"
  );
  const isHtml = (post.content ?? "").trimStart().startsWith("<");

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-6xl h-[85vh] animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute -top-10 -right-10 z-[130] group hidden md:block">
          <X size={40} className="text-white/40 group-hover:text-white transition-all duration-500" />
        </button>

        <div className="w-full h-full bg-[#1b1b1b] rounded-[2rem] border border-white/10
          flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden">

          {/* ══ 左侧：内容区 ══════════════════════════════════════ */}
          <div className="w-full md:w-[65%] h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#0d0d0d]">

            {/* MEDIA 贴：画廊 */}
            {ct === "media" && <MediaGallery post={post} />}

            {/* LINK 贴：链接预览横幅 */}
            {ct === "link" && post.link_url && post.link_meta && (
              <div className="border-b border-white/5">
                {post.link_meta.image && (
                  <div className="w-full aspect-[2/1] overflow-hidden">
                    <img src={post.link_meta.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="px-8 py-4 flex items-center gap-3">
                  <Globe size={14} className="text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{post.link_meta.title}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{post.link_meta.domain}</p>
                  </div>
                  <a href={post.link_url} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20
                      hover:bg-blue-600/30 border border-blue-500/30 rounded-xl
                      text-[12px] text-blue-400 font-bold transition-all shrink-0">
                    <ExternalLink size={13} />访问链接
                  </a>
                </div>
              </div>
            )}

            {/* TEXT 贴无媒体时：无需占位，直接进正文 */}
            {ct === "text" && !isHtml && !post.content && (
              <div className="flex flex-col items-center gap-4 py-16 border-b border-white/5">
                <ShieldAlert size={50} className="text-white/8" />
                <p className="text-white/10 font-black tracking-[0.3em] uppercase italic text-sm">Data Encrypted</p>
              </div>
            )}

            {/* ── 正文区 ── */}
            <div className="p-8 md:p-10 space-y-5 flex-1">

              {/* 标签 */}
              <TagList post={post} />

              {/* 标题 */}
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter">
                {post.title}
              </h2>

              {/* TEXT 贴：富文本内容
                  ★ 图片/视频按编辑器中的位置内联显示
                  ★ 点击图片 → MediaViewer 全屏   */}
              {ct === "text" && isHtml && (
                <RichContent html={post.content} post={post} />
              )}

              {/* TEXT 贴：纯文本兼容（旧帖）*/}
              {ct === "text" && !isHtml && post.content && (
                <p className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                  {post.content}
                </p>
              )}

              {/* LINK 贴：正文补充描述（如有）*/}
              {ct === "link" && post.content && (
                <p className="text-slate-400 text-[14px] leading-relaxed">{post.content}</p>
              )}
            </div>
          </div>

          {/* ══ 右侧：评论区（原样保留）═════════════════════════ */}
          <div className="flex-1 flex flex-col bg-[#161616] border-l border-white/5 relative min-w-[320px]">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center
              bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-10">
              <span className="text-white font-black italic tracking-tighter text-sm uppercase">
                Comments / 交互
              </span>
              {currentUser?.id === post.author_id && (
                <button 
                  onClick={async () => {
                    if (!confirm("确定要删除该帖子吗？删除后无法恢复。")) return;
                    try {
                      await fetchApi(`/posts/${post.id}`, { method: "DELETE" });
                      onClose();
                      // 你可能还需要触发外层刷新列表
                      window.location.reload();
                    } catch (err: any) {
                      alert(`删除失败: ${err.message}`);
                    }
                  }}
                  className="text-[11px] font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  删除帖子
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar relative">
              {isLoadingComments ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500/50" size={32} />
                </div>
              ) : (
                comments.map((comment: any) => (
                  <CommentItem key={comment.id} comment={comment}
                    currentUser={currentUser} postAuthorId={post.author_id}
                    onReply={(c) => setReplyTo(c)}
                    onDelete={handleDeleteComment}
                    onVote={handleCommentVote} />
                ))
              )}
            </div>

            <div className="p-2 pb-6 bg-black/40 border-t border-white/5">
              {replyTo && (
                <div className="mx-4 flex items-center justify-between mb-2 px-4 py-1.5
                  bg-blue-600/10 border-l-2 border-blue-600 rounded-r-md">
                  <p className="text-[11px] text-blue-400 italic">
                    正在回复 @ {replyTo.profiles?.username}
                  </p>
                  <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              )}
              <StyledTelegramInput
                value={newComment}
                onChange={setNewComment}
                onSend={handleSend}
                placeholder={replyTo ? `回复 @${replyTo.profiles?.username}...` : "同步回复至绳网..."}
                isSubmitting={isSubmitting}
                showAttachButton={false}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
