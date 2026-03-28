// EmojiPicker.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Smile, Cat, Apple, Car, Lightbulb, Languages, Flag, Star, Sticker, Gift, X } from 'lucide-react';

// ── 精简表情数据（生产环境建议用 emoji-mart 等库）──
const EMOJI_CATEGORIES = [
  {
    id: 'recent', label: '最近使用', icon: Clock,
    emojis: ['😀','😘','🎄','🧠','🏆','🦆','🍒','🔥','❤️','👍'],
  },
  {
    id: 'people', label: '表情与人物', icon: Smile,
    emojis: [
      '😀','😃','😄','😁','😆','🤣','😂','🙂','😉','😊',
      '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
      '😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐',
      '🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌',
      '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
      '🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓',
      '🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺',
      '😦','😧','😨','😰','😥','😢','😭','😱','😖','😣',
    ],
  },
  {
    id: 'animals', label: '动物与自然', icon: Cat,
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝',
    ],
  },
  {
    id: 'food', label: '食物与饮品', icon: Apple,
    emojis: [
      '🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍑','🍒','🥭',
      '🍍','🥥','🥝','🍅','🫒','🥑','🍆','🥔','🌽','🌶️',
      '🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🧇','🥞',
    ],
  },
  {
    id: 'travel', label: '旅行与地点', icon: Car,
    emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','✈️',
      '🚀','🛸','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉',
      '⛵','🚤','🛥️','🛳️','🚁','🛺','🚲','🛴','🛵','🏍️',
    ],
  },
  {
    id: 'objects', label: '物品', icon: Lightbulb,
    emojis: [
      '💡','🔦','🕯️','🧱','💎','🔑','🗝️','🔒','🔓','🔨',
      '⛏️','🔧','🔩','⚙️','🗜️','🔗','⛓️','🧲','🔫','💊',
      '🩺','🩹','🏥','🧬','🔬','🔭','📡','💻','🖥️','🖨️',
    ],
  },
  {
    id: 'symbols', label: '符号', icon: Languages,
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
      '✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐',
    ],
  },
  {
    id: 'flags', label: '旗帜', icon: Flag,
    emojis: [
      '🏳️','🏴','🚩','🏁','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️',
      '🇨🇳','🇺🇸','🇯🇵','🇰🇷','🇬🇧','🇫🇷','🇩🇪','🇷🇺',
    ],
  },
];

// 底部工具栏
const BOTTOM_TABS = [
  { id: 'emoji', icon: Smile, label: '表情' },
  { id: 'star', icon: Star, label: '收藏' },
  { id: 'sticker', icon: Sticker, label: '贴纸' },
  { id: 'gif', label: 'GIF' },
  { id: 'delete', icon: X, label: '删除' },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [bottomTab, setBottomTab] = useState('emoji');
  const contentRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 滚动时更新激活分类
  const handleScroll = () => {
    if (!contentRef.current) return;
    const scrollTop = contentRef.current.scrollTop;
    for (const cat of EMOJI_CATEGORIES) {
      const el = categoryRefs.current[cat.id];
      if (el && el.offsetTop - 10 <= scrollTop) {
        setActiveCategory(cat.id);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute bottom-full left-0 mb-2 w-[320px] rounded-2xl overflow-hidden shadow-2xl z-50"
      style={{ background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={e => e.stopPropagation()}
    >
      {/* 顶部分类 tab */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-white/[0.06]">
        {EMOJI_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              title={cat.label}
              className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/8'}`}
            >
              <Icon size={18} strokeWidth={1.8} />
            </button>
          );
        })}
      </div>

      {/* 表情内容区 */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="h-[220px] overflow-y-auto px-2 py-2 custom-scrollbar"
      >
        {EMOJI_CATEGORIES.map(cat => (
          <div key={cat.id} ref={el => { categoryRefs.current[cat.id] = el; }}>
            <div className="text-[11px] text-white/40 font-medium px-1 py-1 mt-1">{cat.label}</div>
            <div className="grid grid-cols-8 gap-0.5">
              {cat.emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => { onSelect(emoji); }}
                  className="w-9 h-9 flex items-center justify-center text-[20px] rounded-xl hover:bg-white/10 active:scale-90 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-around px-3 py-2 border-t border-white/[0.06]">
        {BOTTOM_TABS.map(tab => {
          const isActive = bottomTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={`p-2 rounded-xl transition-all ${isActive ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
            >
              {tab.id === 'gif'
                ? <span className="text-[11px] font-bold tracking-wide">GIF</span>
                : tab.icon && <tab.icon size={20} strokeWidth={1.8} />
              }
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};