"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

interface CreateCommunityModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCommunityModal({ onClose, onSuccess }: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("名字不能为空");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      await fetchApi("/communities", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          visibility: "public",
          post_permission: "everyone",
          comment_permission: "everyone",
          join_mode: "open"
        }),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-[400px] bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-medium text-white/90">新建社区</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">社区名称 <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors"
                placeholder="输入社区名字..."
                autoFocus
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">社区描述</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors resize-none h-24"
                placeholder="选填，简单介绍一下这个社区..."
                maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-black/20">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
