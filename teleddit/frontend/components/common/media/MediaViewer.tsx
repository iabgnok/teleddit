// MediaViewer.tsx
// 包含 Provider + Portal，统一在此文件，彻底避免循环引用
"use client";
import React, {
  createContext, useContext, useState, useCallback,
  useEffect, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, ChevronLeft, ChevronRight,
  Play, Pause, Volume2, VolumeX, Maximize2,
} from 'lucide-react';
export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string; // 视频封面
  caption?: string;      // 媒体描述
  fileName?: string;
  size?: { width: number; height: number };
}

// ─── Context（在此文件内定义，MediaViewerContext.tsx 只做类型导出）───
export interface MediaViewerPayload {
  mediaList: MediaItem[];
  initialIndex: number;
  senderName: string;
  timestamp: string;
}

interface ContextValue {
  open: (p: MediaViewerPayload) => void;
  close: () => void;
}

const Ctx = createContext<ContextValue>({ open: () => {}, close: () => {} });
export const useMediaViewer = () => useContext(Ctx);

// ─────────────────────────────────────────────────────────────
// ImageViewer
// ─────────────────────────────────────────────────────────────
const ImageViewer = ({ url }: { url: string }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setScale(1); setOffset({ x: 0, y: 0 }); offsetRef.current = { x: 0, y: 0 };
  }, [url]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(5, Math.max(0.5, s - e.deltaY * 0.002)));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const nx = e.clientX - dragStart.current.x;
    const ny = e.clientY - dragStart.current.y;
    offsetRef.current = { x: nx, y: ny };
    setOffset({ x: nx, y: ny });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
    >
      <img
        src={url} alt="" draggable={false}
        onDoubleClick={() => { setScale(s => s === 1 ? 2 : 1); setOffset({ x: 0, y: 0 }); }}
        className="max-w-full max-h-full object-contain select-none"
        style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// VideoPlayer
// ─────────────────────────────────────────────────────────────
const VideoPlayer = ({ url }: { url: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPlaying(false); setProgress(0); setCurrentTime(0);
  }, [url]);
  useEffect(() => () => clearTimeout(hideTimer.current ?? undefined), []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const resetHide = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current ?? undefined);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current; if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center"
      onMouseMove={resetHide} onClick={togglePlay}>
      <video ref={videoRef} src={url} className="max-w-full max-h-full object-contain"
        muted={muted} loop playsInline
        onTimeUpdate={() => {
          const v = videoRef.current; if (!v) return;
          setCurrentTime(v.currentTime);
          setProgress(v.currentTime / v.duration);
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />

      <AnimatePresence>
        {!playing && (
          <motion.div key="play-icon"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={28} className="text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: showControls || !playing ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 pointer-events-auto"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full h-[3px] bg-white/20 rounded-full cursor-pointer mb-3 group" onClick={handleSeek}>
          <div className="h-full bg-white rounded-full relative" style={{ width: `${progress * 100}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={() => setMuted(m => !m)} className="text-white/70 hover:text-white">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <span className="text-white/70 text-[12px] tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
          </div>
          <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white/70 hover:text-white">
            <Maximize2 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ThumbnailStrip
// ─────────────────────────────────────────────────────────────
const ThumbnailStrip = ({ mediaList, currentIndex, onSelect }: {
  mediaList: MediaItem[]; currentIndex: number; onSelect: (i: number) => void;
}) => {
  if (mediaList.length <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto">
      {mediaList.map((item, i) => {
        const thumbUrl = item.type === 'video' ? item.thumbnailUrl : item.url;
        return (
          <button key={item.id} onClick={() => onSelect(i)}
            className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all
              ${i === currentIndex ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-80'}`}>
            {thumbUrl
              ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Play size={16} className="text-white/60" />
                </div>
            }
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MediaViewerModal（Portal 主体）
// ─────────────────────────────────────────────────────────────
const MediaViewerModal = ({ payload, onClose }: { payload: MediaViewerPayload; onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(payload.initialIndex);
  const current = payload.mediaList[currentIndex];
  const total = payload.mediaList.length;

  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setCurrentIndex(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = current.url;
    a.download = current.fileName ?? `media_${currentIndex + 1}`;
    a.click();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
    >
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.6),transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-white text-[13px] font-bold">
            {payload.senderName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-white text-[14px] font-semibold">{payload.senderName}</div>
            <div className="text-white/50 text-[12px]">{payload.timestamp}</div>
          </div>
        </div>
        {total > 1 && <div className="text-white/60 text-[13px]">{currentIndex + 1} / {total}</div>}
        <div className="flex items-center gap-1">
          <button onClick={handleDownload} className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <Download size={20} />
          </button>
          <button onClick={onClose} className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div key={currentIndex}
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="relative w-full h-full flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          {current.type === 'video'
            ? <VideoPlayer url={current.url} />
            : <ImageViewer url={current.url} />
          }
        </motion.div>

        {currentIndex > 0 && (
          <button onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all hover:scale-110">
            <ChevronLeft size={22} />
          </button>
        )}
        {currentIndex < total - 1 && (
          <button onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all hover:scale-110">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* 底部缩略图 */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }}>
        <ThumbnailStrip mediaList={payload.mediaList} currentIndex={currentIndex} onSelect={setCurrentIndex} />
      </div>
    </motion.div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────
// MediaViewerProvider（在此文件导出，layout.tsx 引入此文件）
// ─────────────────────────────────────────────────────────────
export const MediaViewerProvider = ({ children }: { children: React.ReactNode }) => {
  const [payload, setPayload] = useState<MediaViewerPayload | null>(null);
  const open = useCallback((p: MediaViewerPayload) => setPayload(p), []);
  const close = useCallback(() => setPayload(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {payload && <MediaViewerModal key="viewer" payload={payload} onClose={close} />}
      </AnimatePresence>
    </Ctx.Provider>
  );
};