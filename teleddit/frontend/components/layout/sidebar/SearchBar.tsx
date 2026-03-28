import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}

export default function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="relative mx-3 my-2">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="搜索空间..."
        className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-8 pr-7
          text-[13px] text-slate-200 placeholder:text-slate-600
          focus:outline-none focus:border-blue-500/40 transition-all"
      />
      {value && (
        <button onClick={onClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          <X size={11} />
        </button>
      )}
    </div>
  );
}
