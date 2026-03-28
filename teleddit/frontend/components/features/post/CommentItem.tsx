"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, ArrowBigUp, Loader2, ArrowBigDown, Minus, Plus } from "lucide-react";
import StyledTelegramInput from "@/components/features/chat/input/ChatInput";

// --- 1. 递归评论子组件 ---
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

  return (
    <div className="relative animate-in slide-in-from-left-1 duration-300">
      
      {/* 评论头部：用户信息与折叠/展开开关 */}
      <div className="group/comment relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {/* 折叠/展开按钮：固定在用户名左侧，与 Reddit 逻辑一致 */}
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
              @ {comment.profiles?.username || '空洞绳匠'}
            </span>

            {/* 折叠后的紧凑时间提示 */}
            <span className="text-slate-600 text-[9px] font-mono">
              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* 操作按钮组 */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200">
              <button onClick={() => onReply(comment)} className="text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-tighter">Reply</button>
              {(currentUser?.id === comment.author_id || currentUser?.id === postAuthorId) && (
                <button onClick={() => onDelete(comment.id)} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-tighter">Delete</button>
              )}
            </div>
          )}
        </div>

        {/* 评论正文主体：折叠后完全消失 */}
        {!isCollapsed && (
          <div className="relative bg-white/[0.02] p-3 rounded-xl border border-white/5 group-hover/comment:border-white/20 group-hover/comment:bg-white/[0.04] transition-all duration-300 mb-2">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            
            {/* 投票组件 */}
            <div className="absolute -right-2 -bottom-3 flex items-center opacity-0 group-hover/comment:opacity-100 transition-all duration-300 z-10">
              <div className="flex items-center gap-0.5 bg-[#1b1b1b] px-2 py-0.5 rounded-full border border-white/20 shadow-xl shadow-black/80">
                <button onClick={() => onVote(comment.id, 1)} className={`p-0.5 ${comment.user_voted === 1 ? 'text-blue-500' : 'text-slate-500 hover:text-blue-400'}`}>
                  <ArrowBigUp size={16} fill={comment.user_voted === 1 ? "currentColor" : "none"} />
                </button>
                <span className="text-[10px] font-mono font-black min-w-[12px] text-center text-slate-400">{comment.vote_count || 0}</span>
                <button onClick={() => onVote(comment.id, -1)} className={`p-0.5 ${comment.user_voted === -1 ? 'text-orange-500' : 'text-slate-500 hover:text-orange-400'}`}>
                  <ArrowBigDown size={16} fill={comment.user_voted === -1 ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- 递归子评论：Reddit 竖线交互逻辑 --- */}
      {!isCollapsed && comment.children && comment.children.length > 0 && (
        <div className="ml-[7px] pl-4 mt-2 relative group/thread">
          {/* 交互竖线：点击整根线即可折叠 */}
          <div 
            onClick={() => setIsCollapsed(true)}
            className="absolute left-0 top-0 bottom-0 w-[4px] cursor-pointer group/line"
          >
            {/* 默认线条样式 */}
            <div className="absolute inset-y-0 left-0 w-[2px] bg-white/5 group-hover/line:bg-blue-500/40 transition-colors" />
            
            {/* 线条顶端的折叠指示器（仅在悬停线条时显现） */}
            <div className="absolute -left-[5px] top-0 opacity-0 group-hover/line:opacity-100 transition-opacity">
              <Minus size={12} strokeWidth={4} className="text-blue-500" />
            </div>
          </div>
          
          {/* 子评论容器 */}
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