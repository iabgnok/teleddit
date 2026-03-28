// SendMediaModal.tsx
"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MoreVertical, Plus, AlignStartVertical,
  FileText, Maximize2, Eye, Trash2, Grid2x2,
  File as FileIcon, Layers, AlignJustify,
} from 'lucide-react';
import { EmojiPicker } from "@/components/features/chat/input/EmojiPicker";

export interface MediaPreviewItem {
  file: File;
  url: string;
  type: 'image' | 'video' | 'file';
  spoiler: boolean;
}
export interface SendOptions { sendAsFile: boolean; highQuality: boolean; }

interface Props {
  initialFiles: FileList;
  onSend: (items: MediaPreviewItem[], caption: string, options: SendOptions) => void;
  onClose: () => void;
  forceFileMode?: boolean; // 直接以文件模式打开（附件菜单「文件」选项）
}

const fmtSize = (b: number) =>
  b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

const getFileColor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const m: Record<string,string> = {
    pdf:'#e34234',txt:'#4a90d9',doc:'#2b579a',docx:'#2b579a',
    xls:'#217346',xlsx:'#217346',zip:'#f5a623',rar:'#f5a623',
    mp4:'#9b59b6',mov:'#9b59b6',png:'#27ae60',jpg:'#27ae60',jpeg:'#27ae60',
  };
  return m[ext??''] ?? '#6c7883';
};

const getTitle = (items: MediaPreviewItem[], asFile: boolean) => {
  if (!items.length) return '发送';
  const n = items.length;
  if (asFile) return n === 1 ? '发送文件' : `发送 ${n} 个文件`;
  const hasVideo = items.some(i => i.type === 'video');
  const hasImage = items.some(i => i.type === 'image');
  if (hasVideo && hasImage) return `发送 ${n} 个文件`;
  if (hasVideo) return n === 1 ? '发送视频' : `发送 ${n} 个视频`;
  return n === 1 ? '发送图片' : `发送 ${n} 张图片`;
};

// ─── 三点菜单（fixed 定位，不受父级 overflow 截断）────────────
const ThreeDotMenu = ({
  onAdd, onSendAsFile, onHighQuality, onSpoiler, onToggleGroup,
  onMoveCaptionUp, onClose, asFile, multipleItems, grouped, highQuality, captionUp, hasMediaFiles,
  anchorRef,
}: {
  onAdd: () => void; onSendAsFile: () => void; onHighQuality: () => void;
  onSpoiler: () => void; onToggleGroup: () => void; onMoveCaptionUp: () => void;
  onClose: () => void;
  asFile: boolean; multipleItems: boolean; grouped: boolean;
  highQuality: boolean; captionUp: boolean; hasMediaFiles: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  // 计算 fixed 定位坐标（菜单出现在按钮左下方）
  const rect = anchorRef.current?.getBoundingClientRect();
  const top  = rect ? rect.bottom + 6 : 0;
  const right = rect ? window.innerWidth - rect.right : 0;

  const fileItems = [
    { icon: Plus,         label: '添加',        action: onAdd },
    ...(hasMediaFiles ? [{ icon: FileText, label: '作为媒体发送', action: onSendAsFile }] : []),
    ...(multipleItems ? [{
      icon: grouped ? AlignJustify : Layers,
      label: grouped ? '取消分组' : '恢复分组',
      action: onToggleGroup,
    }] : []),
  ];
  const mediaItems = [
    { icon: Plus,               label: '添加',          action: onAdd },
    { icon: AlignStartVertical, label: captionUp ? '下移说明' : '上移说明', action: onMoveCaptionUp },
    { icon: FileText,           label: '作为文件发送',  action: onSendAsFile },
    { icon: Maximize2,          label: highQuality ? '取消高清' : '高清发送', action: onHighQuality },
    { icon: Eye,                label: '启用剧透',       action: onSpoiler },
    ...(multipleItems ? [{
      icon: grouped ? AlignJustify : Layers,
      label: grouped ? '取消分组' : '恢复分组',
      action: onToggleGroup,
    }] : []),
  ];
  const items = asFile ? fileItems : mediaItems;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.13 }}
      className="fixed w-[230px] rounded-2xl overflow-hidden shadow-2xl py-1"
      style={{
        top,
        right,
        zIndex: 99999,
        background: 'rgba(30,42,56,0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {items.map(item => (
        <button key={item.label} onClick={() => { item.action(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-[11px] hover:bg-white/8 transition-colors text-left">
          <item.icon size={18} className="text-white/60 shrink-0" strokeWidth={1.8} />
          <span className="text-[15px] text-white/90">{item.label}</span>
        </button>
      ))}
    </motion.div>,
    document.body
  );
};

// ─── 视频时长 ────────────────────────────────────────────────
const VideoDuration = ({ src }: { src: string }) => {
  const [dur, setDur] = useState<string|null>(null);
  useEffect(() => {
    const v = document.createElement('video');
    v.src = src;
    v.onloadedmetadata = () => {
      const s = Math.floor(v.duration);
      setDur(`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`);
    };
  }, [src]);
  if (!dur) return null;
  return (
    <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] px-1.5 py-0.5 rounded font-medium z-10">
      {dur}
    </div>
  );
};

// ─── 单个媒体项 ──────────────────────────────────────────────
const MediaItem = ({ item, index, total, onRemove, onToggleSpoiler, highQuality, grouped }: {
  item: MediaPreviewItem; index: number; total: number;
  onRemove: () => void; onToggleSpoiler: () => void;
  highQuality: boolean; grouped: boolean;
}) => (
  /*
   * 关键修复：明确给容器设置高度
   * - 分组模式单项：min-h-[220px]，多项：min-h-[160px]
   * - 非分组（竖列）：固定高度 240px
   * position:relative 让绝对定位的操作栏正确锚定
   */
  <div
    className="relative overflow-hidden bg-black/20 w-full"
    style={{ minHeight: grouped ? (total === 1 ? '320px' : '180px') : '240px' }}
  >
    {item.type === 'video'
      ? <video src={item.url} className="w-full h-full object-cover absolute inset-0" muted playsInline />
      : <img src={item.url} className="w-full h-full object-cover absolute inset-0 select-none" alt="" draggable={false} />
    }

    {/* 剧透遮罩 */}
    {item.spoiler && (
      <div className="absolute inset-0 backdrop-blur-xl bg-black/40 flex items-center justify-center z-10">
        <Eye size={32} className="text-white/80" />
      </div>
    )}

    {/* 高清角标 */}
    {highQuality && (
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
        HD
      </div>
    )}

    {item.type === 'video' && <VideoDuration src={item.url} />}

    {/* 右下角操作栏：始终渲染，z-20 确保在遮罩之上 */}
    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
      <button
        onClick={onToggleSpoiler}
        title={item.spoiler ? '关闭剧透' : '启用剧透'}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
          ${item.spoiler ? 'bg-[#2b9fd9] text-white' : 'bg-black/60 text-white/80 hover:bg-black/80'}`}
      >
        <Grid2x2 size={15} strokeWidth={2} />
      </button>
      {total > 1 && (
        <button onClick={onRemove} title="删除"
          className="w-8 h-8 rounded-lg bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white flex items-center justify-center transition-all">
          <Trash2 size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  </div>
);

// ─── 媒体网格 ────────────────────────────────────────────────
const MediaGrid = ({ items, onRemove, onToggleSpoiler, highQuality, grouped }: {
  items: MediaPreviewItem[];
  onRemove: (i: number) => void;
  onToggleSpoiler: (i: number) => void;
  highQuality: boolean;
  grouped: boolean;
}) => {
  const n = items.length;

  // 非分组：竖列排列
  if (!grouped) {
    return (
      <div className="flex flex-col gap-[2px]">
        {items.map((item, i) => (
          <MediaItem key={`${item.url}-${i}`} item={item} index={i} total={n}
            onRemove={() => onRemove(i)} onToggleSpoiler={() => onToggleSpoiler(i)}
            highQuality={highQuality} grouped={false} />
        ))}
      </div>
    );
  }

  // 分组：网格排列
  const getGrid = (n: number) => {
    if (n === 1) return { cols: 'grid-cols-1', className: '' };
    if (n === 2) return { cols: 'grid-cols-2', className: '' };
    if (n === 3) return { cols: 'grid-cols-2 grid-rows-2', className: '' };
    return { cols: 'grid-cols-2', className: '' };
  };
  const { cols } = getGrid(n);

  return (
    <div className={`grid gap-[2px] ${cols}`} style={{
      // 三张时第一格占两行
      gridTemplateRows: n === 3 ? 'repeat(2, 180px)' : undefined,
    }}>
      {items.map((item, i) => (
        <div key={`${item.url}-${i}`}
          style={{ gridRow: n === 3 && i === 0 ? 'span 2' : undefined }}>
          <MediaItem item={item} index={i} total={n}
            onRemove={() => onRemove(i)} onToggleSpoiler={() => onToggleSpoiler(i)}
            highQuality={highQuality} grouped={true} />
        </div>
      ))}
    </div>
  );
};

// ─── 文件列表 ────────────────────────────────────────────────
const FileList = ({ items, onRemove }: { items: MediaPreviewItem[]; onRemove: (i: number) => void }) => (
  <div className="flex flex-col gap-1 px-3 py-2">
    {items.map((item, i) => {
      const ext = item.file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
      const color = getFileColor(item.file.name);
      const isMedia = item.type === 'image' || item.type === 'video';
      return (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors group">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            {isMedia
              ? (item.type === 'image'
                  ? <img src={item.url} className="w-full h-full object-cover" alt="" />
                  : <video src={item.url} className="w-full h-full object-cover" muted />)
              : <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: color }}>
                  <FileIcon size={18} className="text-white" strokeWidth={1.5} />
                  <span className="text-white text-[9px] font-bold mt-0.5">{ext.slice(0,4)}</span>
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[14px] truncate">{item.file.name}</div>
            <div className="text-white/45 text-[12px] mt-0.5">{fmtSize(item.file.size)}</div>
          </div>
          <button onClick={() => onRemove(i)}
            className="p-2 text-white/30 hover:text-white/70 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 size={18} strokeWidth={1.8} />
          </button>
        </div>
      );
    })}
  </div>
);

// ─── 说明文字（上移到媒体顶部时显示）────────────────────────
const CaptionOverlay = ({ caption, onChange }: { caption: string; onChange: (v: string) => void }) => (
  <div className="px-3 py-2 border-b border-white/[0.06]">
    <input
      type="text" value={caption} onChange={e => onChange(e.target.value)}
      placeholder="图片的说明..."
      className="w-full bg-white/5 rounded-xl px-3 py-2 text-[14px] text-white placeholder:text-white/30 border border-white/10 outline-none"
      autoFocus
    />
  </div>
);

// ─── 主组件 ──────────────────────────────────────────────────
export const SendMediaModal = ({ initialFiles, onSend, onClose, forceFileMode = false }: Props) => {
  const [items, setItems]           = useState<MediaPreviewItem[]>([]);
  const [caption, setCaption]       = useState('');
  const [showMenu, setShowMenu]     = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [options, setOptions]       = useState<SendOptions>({ sendAsFile: false, highQuality: false });
  const [grouped, setGrouped]       = useState(true);
  const [captionUp, setCaptionUp]   = useState(false); // 说明上移到媒体顶部
  const [mounted, setMounted]       = useState(false);

  const addInputRef      = useRef<HTMLInputElement>(null);
  const captionRef       = useRef<HTMLInputElement>(null);
  const emojiRef         = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef       = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const newItems: MediaPreviewItem[] = Array.from(initialFiles).map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file',
      spoiler: false,
    }));
    setItems(newItems);
    // forceFileMode：以文件模式打开（但用户可通过菜单切换）
    if (forceFileMode) setOptions(o => ({ ...o, sendAsFile: true }));
    return () => { newItems.forEach(i => URL.revokeObjectURL(i.url)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!emojiRef.current?.contains(e.target as Node))     setShowEmoji(false);
      if (!menuContainerRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleRemove = useCallback((i: number) => {
    setItems(prev => {
      URL.revokeObjectURL(prev[i].url);
      const next = prev.filter((_, idx) => idx !== i);
      if (!next.length) onClose();
      return next;
    });
  }, [onClose]);

  const handleToggleSpoiler = useCallback((i: number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, spoiler: !item.spoiler } : item));
  }, []);

  const handleAddFiles = (files: FileList) => {
    const newItems: MediaPreviewItem[] = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file' as const,
      spoiler: false,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const insertEmoji = (emoji: string) => {
    const input = captionRef.current;
    if (!input) { setCaption(c => c + emoji); return; }
    const start = input.selectionStart ?? caption.length;
    const end   = input.selectionEnd   ?? caption.length;
    const next  = caption.slice(0, start) + emoji + caption.slice(end);
    setCaption(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleSend = () => { onSend(items, caption, options); onClose(); };

  // 是否有真正的媒体文件（图片或视频），决定文件模式下是否显示「作为媒体发送」
  const hasMediaFiles = items.some(i => i.type === 'image' || i.type === 'video');
  // forceFileMode 只影响初始状态（通过 useEffect 设置），不强制锁定
  // 用户可以通过三点菜单「作为媒体发送」切换回媒体模式
  const isFileMode = options.sendAsFile
    || (items.length > 0 && items.every(i => i.type === 'file'));

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-[480px] bg-[#17212b] rounded-3xl flex flex-col shadow-2xl"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/8 transition-all">
            <X size={22} />
          </button>
          <span className="text-[16px] font-semibold text-white">{getTitle(items, isFileMode)}</span>
          <div className="relative overflow-visible" ref={menuContainerRef} style={{ zIndex: 9999 }}>
            <button ref={menuBtnRef} onClick={() => setShowMenu(v => !v)}
              className={`p-1.5 rounded-full hover:bg-white/8 transition-all ${showMenu ? 'text-white' : 'text-white/60 hover:text-white'}`}>
              <MoreVertical size={22} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <ThreeDotMenu
                  onAdd={() => addInputRef.current?.click()}
                  onSendAsFile={() => setOptions(o => ({ ...o, sendAsFile: !o.sendAsFile }))}
                  onHighQuality={() => setOptions(o => ({ ...o, highQuality: !o.highQuality }))}
                  onSpoiler={() => setItems(prev => prev.map(i => ({ ...i, spoiler: !i.spoiler })))}
                  onToggleGroup={() => setGrouped(g => !g)}
                  onMoveCaptionUp={() => setCaptionUp(u => !u)}
                  onClose={() => setShowMenu(false)}
                  asFile={isFileMode}
                  multipleItems={items.length > 1}
                  grouped={grouped}
                  highQuality={options.highQuality}
                  captionUp={captionUp}
                  hasMediaFiles={hasMediaFiles}
                  anchorRef={menuBtnRef}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <input ref={addInputRef} type="file" accept="image/*,video/*,*/*" multiple className="hidden"
          onChange={e => { if (e.target.files) handleAddFiles(e.target.files); }} />

        {/* 说明上移时显示在媒体顶部 */}
        <AnimatePresence>
          {captionUp && !isFileMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            >
              <CaptionOverlay caption={caption} onChange={setCaption} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容区 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isFileMode
            ? <FileList items={items} onRemove={handleRemove} />
            : (
              <div className="mx-3 rounded-xl overflow-hidden">
                <MediaGrid
                  items={items}
                  onRemove={handleRemove}
                  onToggleSpoiler={handleToggleSpoiler}
                  highQuality={options.highQuality}
                  grouped={grouped}
                />
              </div>
            )
          }
        </div>

        {/* 底部说明 + 发送（说明上移时隐藏输入框但保留发送按钮）*/}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 border-t border-white/[0.06]">
          {/* 表情按钮 */}
          <div ref={emojiRef} className="relative shrink-0">
            <button onClick={() => setShowEmoji(v => !v)}
              className={`text-[22px] leading-none transition-opacity ${showEmoji ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
              🙂
            </button>
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* 说明未上移时才显示输入框 */}
          {!captionUp ? (
            <input ref={captionRef} type="text" value={caption}
              onChange={e => setCaption(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isFileMode ? '添加说明...' : '图片的说明...'}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-white placeholder:text-white/30" />
          ) : (
            <div className="flex-1" />
          )}

          <button onClick={handleSend}
            className="px-5 py-2 bg-[#2b9fd9] hover:bg-[#3aaeea] text-white font-semibold text-[14px] rounded-full transition-all active:scale-95 shrink-0">
            发送
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};