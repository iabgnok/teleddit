// ChecklistModal.tsx
"use client";
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

interface ChecklistModalProps {
  onClose: () => void;
  onSubmit?: (data: ChecklistData) => void;
}

export interface ChecklistData {
  title: string;
  items: { text: string; emoji?: string }[];
}

// 常用快捷表情
const QUICK_EMOJIS = ['✅','📌','🔥','⭐','📝','🎯','💡','🛒','📦','🔑','🎁','⚡'];

export const ChecklistModal = ({ onClose, onSubmit }: ChecklistModalProps) => {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([{ text: '', emoji: '' }]);
  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addItem = () => {
    if (items.length >= 28) return;
    setItems(prev => [...prev, { text: '', emoji: '' }]);
    // 聚焦新增的输入框
    setTimeout(() => {
      inputRefs.current[items.length]?.focus();
    }, 50);
  };

  const removeItem = (i: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== i));
    setEmojiPickerIdx(null);
  };

  const updateItem = (i: number, text: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, text } : item));
  };

  const updateEmoji = (i: number, emoji: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, emoji } : item));
    setEmojiPickerIdx(null);
  };

  const canCreate = title.trim() && items.some(i => i.text.trim());

  const handleCreate = () => {
    if (!canCreate) return;
    onSubmit?.({ title, items: items.filter(i => i.text.trim()) });
    onClose();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-[480px] bg-[#17212b] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 border-b border-white/[0.06]">
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/8 transition-all">
            <X size={22} />
          </button>
          <span className="text-[16px] font-semibold text-white">新建清单</span>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all
              ${canCreate ? 'bg-[#2b9fd9] text-white hover:bg-[#3aaeea] active:scale-95' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
          >
            创建
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* 清单标题 */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="清单标题..."
            maxLength={255}
            className="w-full bg-white/5 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-white/25 border border-white/[0.08] outline-none focus:border-[#2b9fd9]/50 transition-colors"
          />

          {/* 清单项目 */}
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 relative">
                {/* 表情按钮 */}
                <div className="relative">
                  <button
                    onClick={() => setEmojiPickerIdx(emojiPickerIdx === i ? null : i)}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] flex items-center justify-center text-[16px] flex-shrink-0 transition-colors"
                  >
                    {item.emoji || '☐'}
                  </button>
                  {/* 快捷表情选择器 */}
                  {emojiPickerIdx === i && (
                    <div
                      className="absolute bottom-full left-0 mb-1 bg-[#1e2d3d] border border-white/10 rounded-2xl p-2 flex flex-wrap gap-1 z-50 shadow-2xl"
                      style={{ width: '200px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {QUICK_EMOJIS.map(e => (
                        <button key={e} onClick={() => updateEmoji(i, e)}
                          className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-white/10 rounded-lg transition-colors">
                          {e}
                        </button>
                      ))}
                      <button onClick={() => updateEmoji(i, '')}
                        className="w-8 h-8 flex items-center justify-center text-[12px] text-white/40 hover:bg-white/10 rounded-lg transition-colors">
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={el => { inputRefs.current[i] = el; }}
                  value={item.text}
                  onChange={e => updateItem(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
                    if (e.key === 'Backspace' && !item.text && items.length > 1) removeItem(i);
                  }}
                  placeholder={`任务 ${i + 1}`}
                  maxLength={200}
                  className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-white/25 border border-white/[0.08] outline-none focus:border-[#2b9fd9]/50 transition-colors"
                />

                {items.length > 1 && (
                  <button onClick={() => removeItem(i)}
                    className="p-2 text-white/25 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {/* 添加项目 */}
            {items.length < 28 && (
              <button onClick={addItem}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/15 hover:border-white/30 text-white/40 hover:text-white/60 transition-all">
                <Plus size={17} />
                <span className="text-[14px]">添加任务（{items.length}/28）</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};