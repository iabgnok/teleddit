"use client";
// components/modals/CreatePostModal.tsx

import { useState, useRef, lazy, Suspense } from "react";
import {
  X, Link2, Image as ImageIcon,
  AlertCircle, Bookmark, AlignLeft
} from "lucide-react";
import type { TagDef } from "@/lib/mock/tags";
import CommunityPicker from "@/components/features/community/CommunityPicker";
import TagSelector from "@/components/features/post/TagSelector";
import MediaUploadForm from "@/components/features/post/forms/MediaUploadForm";
import LinkInputForm from "@/components/features/post/forms/LinkInputForm";
import { createPost, getLinkPreview, type LinkMeta } from "@/lib/api/post";

const RichTextEditor = lazy(() => import("@/components/common/editor/RichTextEditor"));

type ContentType = "text" | "media" | "link";

const CONTENT_TYPES: { type: ContentType; label: string; Icon: React.ElementType }[] = [
  { type: "text",  label: "文章",     Icon: AlignLeft   },
  { type: "media", label: "图片与视频", Icon: ImageIcon   },
  { type: "link",  label: "链接",     Icon: Link2       },
];

export default function CreatePostModal({ isOpen, onClose, onPublish }: any) {
  const [contentType, setContentType] = useState<ContentType>("text");
  const [communityId, setCommunityId] = useState<string | null>("square");
  const [title, setTitle] = useState("");
  const [richContent, setRichContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagDef[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAsDraft, setSubmitAsDraft] = useState(false);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Link
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const linkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setTitle(""); setRichContent(""); setSelectedTags([]);
    setImages([]); setCoverIndex(0);
    setLinkUrl(""); setLinkMeta(null);
  };

  const toggleTag = (tag: TagDef) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  const handleSelectCommunity = (id: string) => {
    setCommunityId(id);
    setSelectedTags([]);
  };

  const handleLinkUrlChange = (val: string) => {
    setLinkUrl(val);
    setLinkMeta(null);
    if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current);
    if (!val.startsWith("http")) { setLinkLoading(false); return; }
    setLinkLoading(true);
    linkDebounceRef.current = setTimeout(async () => {
      try {
        const meta = await getLinkPreview(val);
        setLinkMeta(meta);
      } catch {
        try {
          const hostname = new URL(val).hostname.replace(/^www\./, "");
          setLinkMeta({ title: hostname, domain: hostname });
        } catch {}
      }
      setLinkLoading(false);
    }, 800);
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (!communityId) return false;
    if (contentType === "link" && !linkUrl.startsWith("http")) return false;
    return true;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!isValid() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitAsDraft(asDraft);
    const postData = {
      title, 
      content: richContent, 
      contentType,
      communityId: communityId!, // Assert not null since we check isValid()
      tagIds: selectedTags.map((t) => t.id),
      isDraft: asDraft,
      coverUrl: contentType === "media" && images.length > 0 ? (images[coverIndex] || images[0]) : undefined,
      mediaUrls: contentType === "media" ? images : undefined,
      linkUrl: contentType === "link" ? linkUrl : undefined,
    };
    try {
      const result = await createPost(postData);
      onPublish?.(result); 
      resetAll(); 
      onClose();
    } catch (err: any) {
       alert(`发布失败: ${err.message || "未知错误"}`);
    } finally { 
      setIsSubmitting(false); 
      setSubmitAsDraft(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center
      bg-black/85 backdrop-blur-xl overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 z-0" onClick={() => { resetAll(); onClose(); }} />

      <div className="relative z-10 w-full max-w-2xl
        bg-[#111111] rounded-[2rem] border border-white/8 shadow-2xl shadow-black/80
        flex flex-col overflow-hidden">

        {/* ── 顶栏 ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/6">
          <h2 className="text-[17px] font-black text-white tracking-tight">创建帖子</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => handleSubmit(true)} disabled={!isValid()}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-semibold
                transition-all
                ${isValid()
                  ? "border-white/12 text-slate-300 hover:bg-white/6 hover:text-white"
                  : "border-white/5 text-slate-600 cursor-not-allowed"}`}>
              <Bookmark size={12} />
              存草稿
            </button>
            <button onClick={() => { resetAll(); onClose(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full
                bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white
                transition-all hover:rotate-90">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── 社区选择 ── */}
        <div className="px-6 py-3.5 border-b border-white/5">
          <CommunityPicker selected={communityId} onSelect={handleSelectCommunity} />
        </div>

        {/* ── 类型 Tab ── */}
        <div className="flex border-b border-white/6 px-6">
          {CONTENT_TYPES.map(({ type, label, Icon }) => {
            const active = contentType === type;
            return (
              <button key={type} onClick={() => setContentType(type)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-[13px] font-bold
                  transition-all whitespace-nowrap
                  ${active ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={15} />
                {label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── 表单主体 ── */}
        <div className="px-6 py-5 community-y-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 280px)" }}>

          {/* 标题 */}
          <div className="relative mb-4">
            <input
              placeholder={"标题 *"}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 300))}
              className="w-full bg-white/3 border border-white/8 rounded-2xl
                px-5 py-3.5 pr-16 text-[15px] font-semibold text-white
                placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-all"
            />
            <span className={`absolute right-4 bottom-3.5 text-[11px] font-mono
              ${title.length > 270 ? "text-orange-400" : "text-slate-600"}`}>
              {title.length}/300
            </span>
          </div>

          {/* 标签选择器 */}
          <div className="mb-4">
            <TagSelector communityId={communityId} selected={selectedTags} onToggle={toggleTag} />
          </div>

          {/* TEXT：Tiptap 富文本编辑器 */}
          {contentType === "text" && (
            <Suspense fallback={
              <div className="rounded-2xl border border-white/8 bg-[#0d0d0d] h-[220px]
                flex items-center justify-center">
                <div className="flex items-center gap-2 text-slate-600 text-[13px]">
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                  加载编辑器...
                </div>
              </div>
            }>
              <RichTextEditor
                value={richContent}
                onChange={setRichContent}
                placeholder="正文（可选）"
                minHeight={200}
              />
            </Suspense>
          )}

          {/* MEDIA：多图上传 */}
          {contentType === "media" && (
            <MediaUploadForm 
              images={images}
              setImages={setImages}
              coverIndex={coverIndex}
              setCoverIndex={setCoverIndex}
              richContent={richContent}
              setRichContent={setRichContent}
            />
          )}

          {/* LINK：URL + 预览 */}
          {contentType === "link" && (
            <LinkInputForm 
              linkUrl={linkUrl}
              onLinkUrlChange={handleLinkUrlChange}
              linkLoading={linkLoading}
              linkMeta={linkMeta}
            />
          )}
        </div>

        {/* ── 底部操作栏 ── */}
        <div className="px-6 py-4 border-t border-white/6 flex items-center gap-3">
          <div className="flex-1 text-[12px]">
            {!title.trim() ? (
              <span className="flex items-center gap-1.5 text-slate-600">
                <AlertCircle size={12} />
                {"标题不能为空"}
              </span>
            ) : title.trim() && contentType === "link" && !linkUrl.startsWith("http") ? (
              <span className="flex items-center gap-1.5 text-amber-500/70">
                <AlertCircle size={12} />
                请输入有效的 https:// 链接
              </span>
            ) : null}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={!isValid() || isSubmitting}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-2xl font-black text-[14px]
              transition-all active:scale-95
              ${isValid() && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
            {isSubmitting && !submitAsDraft
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />发布中</>
              : "发布"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
