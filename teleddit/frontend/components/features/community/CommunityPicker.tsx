import { useState, useEffect } from "react";
import { ChevronDown, Search, Check, Hash } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

interface Community {
  id: string;
  name: string;
  memberCount?: number;
}

export const getCommunities = () => {
  return fetchApi<Community[]>("/communities", { requireAuth: false });
};

interface CommunityPickerProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function CommunityPicker({ selected, onSelect }: CommunityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [apiCommunities, setApiCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (apiCommunities.length > 0) return;
    let isMounted = true;
    setLoading(true);
    getCommunities()
      .then(data => {
        if (isMounted) setApiCommunities(data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [apiCommunities.length]);

  const filtered = apiCommunities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const current = selected ? apiCommunities.find((c) => c.id === selected) : null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2.5 h-10 px-4 rounded-full border transition-all text-[13px] font-bold
          ${current
            ? "bg-white/8 border-white/15 text-white"
            : "bg-white/4 border-white/8 text-slate-400 hover:border-white/15 hover:text-white"}`}
      >
        {current ? (
          <>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500
              flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {current.name[0].toUpperCase()}
            </div>
            r/{current.name}
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Hash size={12} className="text-slate-500" />
            </div>
            选择社区
          </>
        )}
        <ChevronDown size={13} className={`ml-0.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 z-20
            bg-[#1e1e1e] border border-white/12 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="p-2 border-b border-white/8">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input autoFocus placeholder="搜索社区..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 rounded-xl pl-8 pr-3 py-2 text-[12px] text-white
                    placeholder:text-slate-600 outline-none" />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-[12px]">加载中...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[12px]">未找到社区</div>
              ) : (
                filtered.map((c) => (
                  <button key={c.id}
                    onClick={() => { onSelect(c.id); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-left transition-colors
                      ${selected === c.id ? "bg-blue-600/15 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500
                      flex items-center justify-center text-[11px] font-black text-white shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">r/{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.memberCount?.toLocaleString() || 0} 位成员</p>
                    </div>
                    {selected === c.id && <Check size={14} className="text-blue-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
