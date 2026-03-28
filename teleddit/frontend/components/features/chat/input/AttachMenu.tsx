// AttachMenu.tsx
"use client";
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, FileText, BarChart2, CheckSquare } from 'lucide-react';

interface AttachMenuProps {
  onPhotoVideo: (files: FileList) => void;
  onFile?: (files: FileList) => void;
  onChecklist?: () => void;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'photo',     icon: Image,       label: '图片或视频', accept: 'image/*,video/*' },
  { id: 'file',      icon: FileText,    label: '文件',       accept: '*/*' },
  { id: 'checklist', icon: CheckSquare, label: '清单',       accept: null },
];

export const AttachMenu = ({ onPhotoVideo, onFile, onChecklist, onClose }: AttachMenuProps) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const handleItem = (id: string) => {
    if (id === 'photo')     { photoInputRef.current?.click(); return; }
    if (id === 'file')      { fileInputRef.current?.click();  return; }
    if (id === 'checklist') { onClose(); setTimeout(() => onChecklist?.(), 0); return; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      /*
       * 关键：bottom-full 让菜单出现在按钮正上方
       * right-0 对齐按钮右侧
       * mb-2 与按钮保持间距
       */
      className="absolute bottom-full right-0 mb-2 w-[200px] rounded-2xl overflow-hidden shadow-2xl z-50 py-1"
      style={{ background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={e => e.stopPropagation()}
    >
      <input ref={photoInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
        onChange={e => { if (e.target.files?.length) { onPhotoVideo(e.target.files); onClose(); } }} />
      <input ref={fileInputRef} type="file" accept="*/*" multiple className="hidden"
        onChange={e => { if (e.target.files?.length) { onFile?.(e.target.files); onClose(); } }} />

      {MENU_ITEMS.map(item => (
        <button key={item.id} onClick={() => handleItem(item.id)}
          className="w-full flex items-center gap-3 px-4 py-[11px] hover:bg-white/8 transition-colors text-left">
          <item.icon size={19} className="text-white/60 shrink-0" strokeWidth={1.8} />
          <span className="text-[15px] text-white/90">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
};