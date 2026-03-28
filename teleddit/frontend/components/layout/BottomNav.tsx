"use client";

// components/sidebar/BottomNav.tsx
// 侧栏底部的固定导航栏。

import {
  Home,
  Compass,
  PenSquare,
  Bell,
} from "lucide-react";

interface BottomNavProps {
  onCreatePost?: () => void;
}

export function BottomNav({ onCreatePost }: BottomNavProps) {
  const items = [
    { Icon: Home,      label: "主页",   action: undefined,       active: true },
    { Icon: Compass,   label: "发现",   action: undefined,       active: false },
    { Icon: PenSquare, label: "发帖",   action: onCreatePost,    active: false },
    { Icon: Bell,      label: "通知",   action: undefined,       active: false },
  ];

  return (
    <div className="h-14 shrink-0 border-t border-white/5 bg-black/30 
      flex items-center justify-around px-2">
      {items.map(({ Icon, label, action, active }) => (
        <button
          key={label}
          onClick={action}
          title={label}
          className={`flex flex-col items-center justify-center gap-0.5 w-10 h-10
            rounded-xl transition-all duration-150
            ${active
              ? "text-blue-400"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </button>
      ))}
    </div>
  );
}