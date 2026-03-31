"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, ArrowBigUp, Loader2, ArrowBigDown, Minus, Plus } from "lucide-react";
import StyledTelegramInput from "@/components/features/chat/input/ChatInput";

const CommentItem = ({
  comment,
  currentUser,
  postAuthorId,
  onReply,
  onDelete,
  onVote
}: {
  comment: any;
  currentUser: any;
  postAuthorId: string;
  onReply: (c: any) => void;
  onDelete: (id: string) => void;
  onVote: (id: string, type: number) => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  let dateString = "Unknown";
  try {
    const rawDate = comment.createdAt || comment.created_at;
    if (rawDate) {
      const dateStr = String(rawDate).includes('T') && !String(rawDate).endsWith('Z') ? rawDate + 'Z' : rawDate;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dateString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch(e) {}

  const upvotes = comment.upvotes || 0;
  const downvotes = comment.downvotes || 0;
  const userVoted = comment.userVoted !== undefined ? comment.userVoted : (comment.user_voted || 0);
  const authorId = comment.authorId || comment.author_id;

  return (
    <div className="relative animate-in slide-in-from-left-1 duration-300">
      <div className="group/comment relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-0.5 -ml-1 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded transition-all"
            >
              {isCollapsed ? (
                <Plus size={14} strokeWidth={3} className="text-blue-500" />    
              ) : (
                <Minus size={14} strokeWidth={3} className="opacity-0 group-hover/comment:opacity-100" />
              )}
            </button>

            <span className="text-blue-500 font-bold text-[11px] italic">
              @ {comment.author || 'Anonymous'}
            </span>

            <span className="text-slate-600 text-[9px] font-mono">
              {dateString}
            </span>
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200">
              <button onClick={() => onReply(comment)} className="text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-tighter">Reply</button>
              {(currentUser?.id === authorId || currentUser?.id === postAuthorId) && (
                <button onClick={() => onDelete(comment.id)} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-tighter">Delete</button>
              )}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="relative bg-white/[0.02] p-3 rounded-xl border border-white/5 group-hover/comment:border-white/20 group-hover/comment:bg-white/[0.04] transition-all duration-300 mb-2">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

            <div className="absolute -right-2 -bottom-3 flex items-center opacity-0 group-hover/comment:opacity-100 transition-all duration-300 z-10">
              <div className="flex items-center gap-0.5 bg-[#1b1b1b] px-2 py-0.5 rounded-full border border-white/20 shadow-xl shadow-black/80">
                <button onClick={() => onVote(comment.id, 1)} className={`p-0.5 ${userVoted === 1 ? 'text-orange-500' : 'text-slate-500 hover:text-orange-400'}`}>
                  <ArrowBigUp size={16} fill={userVoted === 1 ? "currentColor" : "none"} />
                </button>
                <span className="text-[10px] font-mono font-black min-w-[12px] text-center text-slate-400">{upvotes}</span>
                <button onClick={() => onVote(comment.id, -1)} className={`p-0.5 ${userVoted === -1 ? 'text-blue-500' : 'text-slate-500 hover:text-blue-400'}`}>
                  <ArrowBigDown size={16} fill={userVoted === -1 ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && comment.children && comment.children.length > 0 && (     
        <div className="ml-[7px] pl-4 mt-2 relative group/thread">
          <div
            onClick={() => setIsCollapsed(true)}
            className="absolute left-0 top-0 bottom-0 w-[4px] cursor-pointer group/line"
          >
            <div className="absolute inset-y-0 left-0 w-[2px] bg-white/5 group-hover/line:bg-blue-500/40 transition-colors" />

            <div className="absolute -left-[5px] top-0 opacity-0 group-hover/line:opacity-100 transition-opacity">
              <Minus size={12} strokeWidth={4} className="text-blue-500" />     
            </div>
          </div>

          <div className="community-y-6 pt-1">
            {comment.children.map((child: any) => (
              <CommentItem
                key={child.id}
                comment={child}
                currentUser={currentUser}
                postAuthorId={postAuthorId}
                onReply={onReply}
                onDelete={onDelete}
                onVote={onVote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default CommentItem;
