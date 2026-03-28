"use client";
import React from 'react';
import { Smile, Paperclip, SendHorizontal } from "lucide-react";
import { AnimatePresence } from 'framer-motion';
import { EmojiPicker } from "@/components/features/chat/input/EmojiPicker";
import { AttachMenu } from "@/components/features/chat/input/AttachMenu";
import { SendMediaModal, type MediaPreviewItem, type SendOptions } from "@/components/features/chat/input/SendMediaModal";
import { ChecklistModal, type ChecklistData } from "@/components/features/chat/input/ChecklistModal";
import { useChatInput } from "@/components/features/chat/input/useChatInput";

interface ChatInputProps {
  value?: string;
  onChange?: (v: string) => void;
  onSend?: () => void;
  // 附件发送回调 ──────────────────────────────────────────────
  onSendMedia?: (items: MediaPreviewItem[], caption: string, options: SendOptions) => void;
  onSendChecklist?: (data: ChecklistData) => void;
  // ──────────────────────────────────────────────────────────
  placeholder?: string;
  isSubmitting?: boolean;
  showAttachButton?: boolean;
}

export default function StyledTelegramInput({
  value,
  onChange,
  onSend,
  onSendMedia,
  onSendChecklist,
  placeholder = '输入消息...',
  isSubmitting = false,
  showAttachButton = true,
}: ChatInputProps) {
  // ════════════════════════════════════════════════════════════════════════
  // 📌 SECTION 1: 状态管理与逻辑 (States & Logic) - 已抽离到 useChatInput Hook
  // ════════════════════════════════════════════════════════════════════════
  const {
    text,
    setText,
    showEmoji,
    setShowEmoji,
    showAttach,
    setShowAttach,
    mediaFiles,
    setMediaFiles,
    fileFiles,
    setFileFiles,
    showChecklist,
    setShowChecklist,
    inputRef,
    containerRef,
    handleSend,
    insertEmoji
  } = useChatInput({
    initialValue: value,
    onChange,
    onSend,
    isSubmitting
  });

  const bubbleBg = '#182533';

  // ════════════════════════════════════════════════════════════════════════
  // 📌 SECTION 2: 渲染 (Render) - 包含各种弹出模态框和输入框主体
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} className="flex items-end gap-2 w-full px-3 py-3 pb-6 bg-transparent">

      {/* 图片/视频发送弹窗 */}
      <AnimatePresence>
        {mediaFiles && (
          <SendMediaModal
            initialFiles={mediaFiles}
            onSend={(items, caption, options) => {
              onSendMedia?.(items, caption, options);
              setMediaFiles(null);
            }}
            onClose={() => setMediaFiles(null)}
          />
        )}
      </AnimatePresence>

      {/* 文件发送弹窗 */}
      <AnimatePresence>
        {fileFiles && (
          <SendMediaModal
            initialFiles={fileFiles}
            onSend={(items, caption, options) => {
              onSendMedia?.(items, caption, options);
              setFileFiles(null);
            }}
            onClose={() => setFileFiles(null)}
            forceFileMode
          />
        )}
      </AnimatePresence>


      {/* 清单弹窗 */}
      <AnimatePresence>
        {showChecklist && (
          <ChecklistModal
            onClose={() => setShowChecklist(false)}
            onSubmit={data => {
              onSendChecklist?.(data);
              setShowChecklist(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* 输入框气泡 */}
      <div className="relative flex-1">
        <div
          className="flex items-center h-[48px] px-3 border border-white/[0.08] shadow-md w-full"
          style={{ backgroundColor: bubbleBg, borderRadius: '22px 22px 4px 22px' }}
        >
          {/* Emoji 按钮 */}
          <div className="relative">
            <button type="button"
              onClick={() => { setShowEmoji(v => !v); setShowAttach(false); }}
              className={`p-1 transition-colors shrink-0 ${showEmoji ? 'text-[#6ab3f3]' : 'text-slate-400 hover:text-[#6ab3f3]'}`}>
              <Smile size={22} strokeWidth={2} />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
              )}
            </AnimatePresence>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => { setText(e.target.value); onChange?.(e.target.value); }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 text-[16px] text-white mx-2 placeholder:text-slate-500"
          />

          {showAttachButton && (
            <div className="relative">
              <button type="button"
                onClick={() => { setShowAttach(v => !v); setShowEmoji(false); }}
                className={`p-1 transition-colors shrink-0 rotate-45 ${showAttach ? 'text-[#6ab3f3]' : 'text-slate-400 hover:text-[#6ab3f3]'}`}>
                <Paperclip size={20} strokeWidth={2} />
              </button>
              <AnimatePresence>
                {showAttach && (
                  <AttachMenu
                    onPhotoVideo={files => { setMediaFiles(files); setShowAttach(false); }}
                    onFile={files => { setFileFiles(files); setShowAttach(false); }}
                
                    onChecklist={() => { setShowChecklist(true); setShowAttach(false); }}
                    onClose={() => setShowAttach(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 气泡尾巴 */}
        <div className="absolute -bottom-[1px] -right-[7px] z-10 pointer-events-none">
          <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
            <path d="M10.5 14H0V0C1 5.5 5.5 12.5 10.5 14Z" fill={bubbleBg} />
          </svg>
        </div>
      </div>

      {/* 发送按钮 */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || isSubmitting}
        className={`chat-send-button flex items-center justify-center w-[48px] h-[48px] rounded-full shrink-0 transition-all duration-200
          ${text.trim() ? 'bg-[#2b9fd9] text-white shadow-md active:scale-90' : 'bg-[#182533] text-slate-500 border border-white/[0.08]'}`}>
        <SendHorizontal size={22} strokeWidth={2} className={text.trim() ? 'ml-0.5' : 'opacity-40'} />
      </button>
    </div>
  );
}