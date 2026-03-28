"use client";

// ════════════════════════════════════════════════════════════════════════
// 📌 悬浮操作按钮组件 (FloatingActionButton)
// 负责渲染侧边栏右下角的悬浮操作菜单，用于新建社区/分组等
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { X, Pencil, Hash, FolderPen } from "lucide-react";

interface FloatingActionButtonProps {
  onOpenFolderCreate: () => void;
}

export function FloatingActionButton({ onOpenFolderCreate }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  const actions = [
    { 
      icon: <Hash size={16} />,       
      label: "新建社区",       
      sub: "论坛社区", 
      teleddit: true 
    },
    { 
      icon: <FolderPen size={16} />,  
      label: "新建分组",          
      sub: "自定义分组",
      onClick: () => { 
        onOpenFolderCreate(); 
        setOpen(false); 
      } 
    },
  ];

  return (
    // 容器：相对定位，向上展开菜单
    <div className="relative flex flex-col items-end">
      {/* 展开菜单 */}
      {open && (
        <>
          {/* 点击外部关闭遮罩 */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="relative z-40 mb-2 w-52
            bg-[#1e1e1e]/96 backdrop-blur-xl border border-white/10 rounded-2xl
            shadow-2xl shadow-black/70 py-1.5 overflow-hidden
            animate-in fade-in slide-in-from-bottom-2 duration-150">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick ?? (() => setOpen(false))}
                className="w-full flex items-center gap-3 px-4 py-2.5
                  transition-colors hover:bg-white/8 group/action"
              >
                <span className={`shrink-0 transition-colors
                  ${a.teleddit ? "text-purple-400 group-hover/action:text-purple-300"
                               : "text-slate-400 group-hover/action:text-slate-200"}`}>
                  {a.icon}
                </span>
                <div className="text-left">
                  <p className="text-[13px] text-slate-200 font-medium leading-none">{a.label}</p>
                  <p className={`text-[10px] mt-0.5 leading-none
                    ${a.teleddit ? "text-purple-500" : "text-slate-600"}`}>
                    {a.sub}
                    {a.teleddit && " · Teleddit"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* FAB 按钮本体 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-11 h-11 rounded-full flex items-center justify-center
          shadow-xl transition-all duration-200
          ${open
            ? "bg-[#2a2a2a] border border-white/15 text-slate-300 rotate-45 scale-90"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:scale-105 shadow-violet-500/30"
          }`}
      >
        {open ? <X size={18} /> : <Pencil size={18} />}
      </button>
    </div>
  );
}
