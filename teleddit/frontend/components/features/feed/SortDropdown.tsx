import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/lib/utils/sort";

export default function SortDropdown({ current, onChange }: { current: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const opt = SORT_OPTIONS.find((o) => o.key === current)!;
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-full
          bg-white/5 hover:bg-white/10 border border-white/8
          text-sm font-bold text-white transition-colors"
      >
        <opt.Icon size={14} className={opt.color} />
        {opt.label}
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-44
            bg-[#1a1a1b] border border-white/10 rounded-2xl
            shadow-2xl shadow-black/60 z-20 overflow-hidden
            animate-in fade-in zoom-in-95 duration-100 origin-top-left">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                  ${current === o.key ? "bg-white/8 text-white font-bold" : "text-slate-300 hover:bg-white/5 font-medium"}`}
              >
                <o.Icon size={15} className={o.color} />
                <div>
                  <div className="leading-none">{o.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{o.desc}</div>
                </div>
                {current === o.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
