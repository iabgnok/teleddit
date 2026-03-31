"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowBigUp, ArrowBigDown, Bookmark, MessageCircle, Trash2 } from "lucide-react";

export interface PostContextMenuState {
  x: number;
  y: number;
  post: any;
}

interface Props {
  state: PostContextMenuState;
  onClose: () => void;
  onVote: (postId: string, type: number, e: React.MouseEvent) => void;
  onFavorite: (postId: string, e: React.MouseEvent) => void;
  onComment: (post: any) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
}

function Divider() {
  return <div className="my-1 mx-3 h-px bg-white/8" />;
}

function Item({ icon, label, onClick, danger, active }: {
  icon: React.ReactNode; label: string; onClick?: (e: React.MouseEvent) => void;
  danger?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-[9px] text-[13px] transition-colors
        ${danger ? "text-red-400 hover:bg-red-500/10" : active ? "text-blue-400 hover:bg-blue-500/10" : "text-slate-200 hover:bg-white/8"}`}>
      <span className={danger ? "text-red-400" : active ? "text-blue-400" : "text-slate-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

export function PostContextMenu({ state, onClose, onVote, onFavorite, onComment, onDelete, currentUserId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y, post } = state;
  const [pos, setPos] = useState({ left: x, top: y, opacity: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    let newX = x;
    let newY = y;
    
    if (x + rect.width > vw - 8) newX = vw - rect.width - 8;
    if (y + rect.height > vh - 8) {
      newY = Math.max(8, y - rect.height);
    }
    
    setPos({ left: newX, top: newY, opacity: 1 });
  }, [x, y]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const isOwner = currentUserId === post.author_id;

  const content = (
    <div ref={ref} style={{ left: pos.left, top: pos.top, opacity: pos.opacity, width: 200, position: "fixed" }}
      className="z-[9999] bg-[#212121]/96 backdrop-blur-xl border border-white/10
        rounded-2xl shadow-2xl shadow-black/70 py-1.5 overflow-visible
        animate-in fade-in zoom-in-95 duration-100 origin-top-left transition-opacity">
      
      <Item 
        icon={<ArrowBigUp size={16} fill={post.user_voted === 1 ? "currentColor" : "none"} />} 
        label="点赞" 
        active={post.user_voted === 1}
        onClick={(e) => { onVote(post.id, 1, e); onClose(); }} 
      />
      <Item 
        icon={<ArrowBigDown size={16} fill={post.user_downvoted ? "currentColor" : "none"} />} 
        label="点踩" 
        active={post.user_downvoted}
        onClick={(e) => { onVote(post.id, -1, e); onClose(); }} 
      />
      <Item 
        icon={<Bookmark size={15} />} 
        label="收藏" 
        onClick={(e) => { onFavorite(post.id, e); onClose(); }} 
      />
      <Divider />
      <Item 
        icon={<MessageCircle size={15} />} 
        label="评论" 
        onClick={(e) => { e.stopPropagation(); onComment(post); onClose(); }} 
      />
      
      {isOwner && onDelete && (
        <>
          <Divider />
          <Item 
            icon={<Trash2 size={15} />} 
            label="删除帖子" 
            danger 
            onClick={(e) => { e.stopPropagation(); onDelete(post.id); onClose(); }} 
          />
        </>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
