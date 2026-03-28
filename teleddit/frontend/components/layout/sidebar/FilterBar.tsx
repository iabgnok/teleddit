"use client";

// components/sidebar/FilterBar.tsx
// 横向滚动的 pill 形筛选按钮，仿 Telegram 风格。
// all / community / chat / channel / aggregate

import {
  LayoutGrid,
  Hash,
} from "lucide-react";
import type { SidebarFilter } from "@/types/community";

const FILTERS: {
  key: SidebarFilter;
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: "all",       label: "全部",    Icon: LayoutGrid },
  { key: "community", label: "社区",    Icon: Hash }
];

interface FilterBarProps {
  active: SidebarFilter;
  onChange: (f: SidebarFilter) => void;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none shrink-0">
      {FILTERS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
              whitespace-nowrap transition-all duration-150 shrink-0
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }
            `}
          >
            <Icon size={11} strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}