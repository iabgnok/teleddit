import { useState } from "react";
import { Plus, Hash } from "lucide-react";
import type { TagDef } from "@/lib/mock/tags";
import { SPACE_TAGS } from "@/lib/mock/tags";
import TagBadge from "@/components/common/ui/TagBadge";

interface TagSelectorProps {
  communityId: string | null;
  selected: TagDef[];
  onToggle: (tag: TagDef) => void;
}

export default function TagSelector({ communityId, selected, onToggle }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const availableTags = communityId ? (SPACE_TAGS[communityId] ?? []) : [];

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
      {selected.map((tag) => (
        <button key={tag.id} onClick={() => onToggle(tag)} className="transition-opacity hover:opacity-70">
          <TagBadge name={tag.name} color={tag.color} size="sm" variant="filled" />
        </button>
      ))}

      {(!communityId || availableTags.length === 0) ? (
        <button disabled
          className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/5
            text-[12px] text-slate-600 cursor-not-allowed bg-white/2">
          <Hash size={12} />
          添加标签
          {!communityId && <span className="text-[10px] text-slate-700">（先选社区）</span>}
        </button>
      ) : selected.length < 3 && (
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[12px]
              font-semibold transition-all
              ${open ? "bg-white/10 border-white/20 text-white"
                     : "bg-white/3 border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-200"}`}>
            <Plus size={12} />
            添加标签
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-60 z-20
                bg-[#1e1e1e] border border-white/12 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                <div className="p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2.5">
                    社区标签
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selected.some((s) => s.id === tag.id);
                      return (
                        <button key={tag.id}
                          onClick={() => { onToggle(tag); if (selected.length >= 2) setOpen(false); }}>
                          <TagBadge
                            name={tag.name} color={tag.color} size="sm"
                            variant={isSelected ? "filled" : "outline"}
                            active={isSelected}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-3">最多选 3 个标签</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
