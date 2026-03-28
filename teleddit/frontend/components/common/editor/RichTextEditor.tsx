"use client";
// components/editor/RichTextEditor.tsx
// Tiptap 3.x 兼容 + 上标/下标/插入图片/嵌入视频
//
// 安装依赖（在原基础上追加）：
//   pnpm add @tiptap/extension-image @tiptap/extension-superscript @tiptap/extension-subscript

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";

import { useEffect, useCallback, useState, useRef } from "react";
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Link2, List, ListOrdered, Quote, Code, Code2,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Undo2, Redo2, Minus,
  Heading1, Heading2,
  ImageIcon, Video,
  Superscript as SupIcon,
  Subscript as SubIcon,
  X,
} from "lucide-react";

// ── 工具栏按钮 ──────────────────────────────────────────────
function Btn({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled} title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-100 select-none
        ${active ? "bg-white/15 text-white" : "text-slate-400 hover:text-white hover:bg-white/8"}
        ${disabled ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}`}>
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />;
}

// ── 链接浮层 ────────────────────────────────────────────────
function LinkPopover({ onConfirm, onClose, initialUrl }: {
  onConfirm: (url: string) => void; onClose: () => void; initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  return (
    <div className="absolute bottom-full left-0 mb-2 z-[200]
      bg-[#1e1e1e] border border-white/15 rounded-xl shadow-2xl shadow-black/70
      p-3 flex items-center gap-2 w-80">
      <Link2 size={13} className="text-slate-500 shrink-0" />
      <input autoFocus type="url" placeholder="https://..." value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onConfirm(url); }
          if (e.key === "Escape") onClose();
        }}
        className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600" />
      <button onMouseDown={(e) => { e.preventDefault(); onConfirm(url); }}
        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg">确认</button>
      <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
        className="px-2 py-1 text-slate-500 hover:text-white text-[11px] rounded-lg">取消</button>
    </div>
  );
}

// ── 图片插入浮层 ─────────────────────────────────────────────
function ImagePopover({ onConfirm, onClose }: {
  onConfirm: (src: string, alt: string) => void; onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const r = ev.target?.result as string; setPreviewSrc(r); setUrl(r); };
    reader.readAsDataURL(f);
  };

  const handleUrlBlur = () => { if (url.startsWith("http")) setPreviewSrc(url); };

  return (
    <div className="absolute bottom-full left-0 mb-2 z-[200]
      bg-[#1e1e1e] border border-white/15 rounded-2xl shadow-2xl shadow-black/70 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">插入图片</p>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="text-slate-600 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      {/* URL 输入 */}
      <input type="url" placeholder="图片 URL (https://...)" value={url}
        onChange={(e) => setUrl(e.target.value)} onBlur={handleUrlBlur}
        className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 mb-2
          text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
      {/* 本地上传 */}
      <button onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2 mb-2 border border-dashed
          border-white/10 rounded-xl text-[12px] text-slate-500 hover:border-white/20 hover:text-slate-300 transition-all">
        <ImageIcon size={13} /> 从本地上传
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {/* Alt 文字 */}
      <input type="text" placeholder="图片描述（可选）" value={alt}
        onChange={(e) => setAlt(e.target.value)}
        className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 mb-3
          text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
      {/* 预览 */}
      {previewSrc && (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/30 mb-3 border border-white/8">
          <img src={previewSrc} className="w-full h-full object-contain" alt={alt} />
        </div>
      )}
      <div className="flex gap-2">
        <button onMouseDown={(e) => { e.preventDefault(); if (url) onConfirm(url, alt); }}
          disabled={!url}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-colors
            ${url ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
          插入图片
        </button>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="px-4 py-2 rounded-xl text-[12px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10">
          取消
        </button>
      </div>
    </div>
  );
}

// ── 视频嵌入浮层 ─────────────────────────────────────────────
function VideoPopover({ onConfirm, onClose }: {
  onConfirm: (embedUrl: string) => void; onClose: () => void;
}) {
  const [url, setUrl] = useState("");

  const toEmbed = (raw: string): string => {
    const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const bili = raw.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
    return raw;
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 z-[200]
      bg-[#1e1e1e] border border-white/15 rounded-2xl shadow-2xl shadow-black/70 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">嵌入视频</p>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="text-slate-600 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <input type="url" autoFocus placeholder="YouTube / Bilibili / iframe URL"
        value={url} onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (url) onConfirm(toEmbed(url)); } if (e.key === "Escape") onClose(); }}
        className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 mb-2
          text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
      <p className="text-[10px] text-slate-600 mb-3">支持 YouTube、Bilibili 链接自动转换</p>
      <div className="flex gap-2">
        <button onMouseDown={(e) => { e.preventDefault(); if (url) onConfirm(toEmbed(url)); }}
          disabled={!url}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-colors
            ${url ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
          嵌入视频
        </button>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="px-4 py-2 rounded-xl text-[12px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10">
          取消
        </button>
      </div>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────
interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
}

export default function RichTextEditor({
  value = "", onChange,
  placeholder = "正文（可选）",
  minHeight = 180, autoFocus = false,
}: RichTextEditorProps) {
  const [showLink,  setShowLink]  = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [pendingLink, setPendingLink] = useState("");

  const closeAll = () => { setShowLink(false); setShowImage(false); setShowVideo(false); };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder, emptyEditorClass: "is-editor-empty" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "tiptap-link" } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Image.configure({ HTMLAttributes: { class: "tiptap-image" } }),
      Superscript,
      Subscript,
    ],
    content: value,
    autofocus: autoFocus,
    // ✅ Tiptap 3.x 必须显式设置，避免 SSR hydration mismatch
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content outline-none",
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()); },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      (editor.commands as any).setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // 3.x: 扩展注入的命令 TypeScript 类型不完整，统一用 any
  const c = useCallback(() => editor?.chain().focus() as any, [editor]);

  const openLink = useCallback(() => {
    if (!editor) return;
    setPendingLink(editor.getAttributes("link").href ?? "");
    closeAll();
    setShowLink(true);
  }, [editor]);

  const confirmLink = useCallback((url: string) => {
    if (!editor) return;
    closeAll();
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    const href = url.startsWith("http") ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor]);

  const confirmImage = useCallback((src: string, alt: string) => {
    if (!editor) return;
    closeAll();
    editor.chain().focus().setImage({ src, alt }).run();
  }, [editor]);

  const confirmVideo = useCallback((embedUrl: string) => {
    if (!editor) return;
    closeAll();
    editor.chain().focus().insertContent(
      `<div class="tiptap-video-wrapper"><iframe src="${embedUrl}" class="tiptap-video" frameborder="0" allowfullscreen></iframe></div>`
    ).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0d0d0d] overflow-visible
      focus-within:border-white/20 transition-colors">

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2
        border-b border-white/8 bg-white/[0.02] rounded-t-2xl">

        {/* 标题 */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })} title="大标题"><Heading1 size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })} title="小标题"><Heading2 size={14} /></Btn>
        <Sep />

        {/* 文字格式 */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")} title="粗体 (Ctrl+B)"><Bold size={13} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")} title="斜体 (Ctrl+I)"><Italic size={13} /></Btn>
        <Btn onClick={() => c().toggleUnderline().run()}
          active={editor.isActive("underline")} title="下划线"><UnderlineIcon size={13} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")} title="删除线"><Strikethrough size={13} /></Btn>
        <Btn onClick={() => c().toggleHighlight().run()}
          active={editor.isActive("highlight")} title="高亮"><Highlighter size={13} /></Btn>
        {/* 上标 / 下标 */}
        <Btn onClick={() => c().toggleSuperscript().run()}
          active={editor.isActive("superscript")} title="上标"><SupIcon size={13} /></Btn>
        <Btn onClick={() => c().toggleSubscript().run()}
          active={editor.isActive("subscript")} title="下标"><SubIcon size={13} /></Btn>
        <Sep />

        {/* 对齐 */}
        <Btn onClick={() => c().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })} title="左对齐"><AlignLeft size={13} /></Btn>
        <Btn onClick={() => c().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })} title="居中"><AlignCenter size={13} /></Btn>
        <Btn onClick={() => c().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })} title="右对齐"><AlignRight size={13} /></Btn>
        <Sep />

        {/* 块元素 */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")} title="无序列表"><List size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")} title="有序列表"><ListOrdered size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")} title="引用块"><Quote size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")} title="行内代码"><Code size={13} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")} title="代码块"><Code2 size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线">
          <Minus size={14} />
        </Btn>
        <Sep />

        {/* 链接 */}
        <div className="relative">
          <Btn onClick={openLink} active={editor.isActive("link")} title="插入链接"><Link2 size={13} /></Btn>
          {showLink && <LinkPopover initialUrl={pendingLink} onConfirm={confirmLink} onClose={closeAll} />}
        </div>

        {/* 图片 */}
        <div className="relative">
          <Btn onClick={() => { closeAll(); setShowImage(true); }} active={showImage} title="插入图片">
            <ImageIcon size={14} />
          </Btn>
          {showImage && <ImagePopover onConfirm={confirmImage} onClose={closeAll} />}
        </div>

        {/* 视频 */}
        <div className="relative">
          <Btn onClick={() => { closeAll(); setShowVideo(true); }} active={showVideo} title="嵌入视频">
            <Video size={14} />
          </Btn>
          {showVideo && <VideoPopover onConfirm={confirmVideo} onClose={closeAll} />}
        </div>

        {/* 撤销 / 重做 */}
        <div className="ml-auto flex items-center gap-0.5">
          <Btn onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="撤销 (Ctrl+Z)"><Undo2 size={13} /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="重做"><Redo2 size={13} /></Btn>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}