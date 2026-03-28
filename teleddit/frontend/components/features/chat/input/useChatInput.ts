import { useState, useEffect, useRef, RefObject } from 'react';

interface UseChatInputProps {
  initialValue?: string;
  onChange?: (v: string) => void;
  onSend?: () => void;
  isSubmitting?: boolean;
}

export function useChatInput({
  initialValue,
  onChange,
  onSend,
  isSubmitting
}: UseChatInputProps) {
  const [text, setText] = useState<string>(initialValue ?? "");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
  const [fileFiles, setFileFiles] = useState<FileList | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof initialValue === 'string') setText(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowAttach(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const handleSend = () => {
    if (!text.trim() || isSubmitting) return;
    if (onSend) onSend();
    else setText("");
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) { 
      const next = text + emoji;
      setText(next);
      onChange?.(next);
      return; 
    }
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    onChange?.(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  return {
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
  };
}
