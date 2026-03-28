import { LayoutList, LayoutGrid } from "lucide-react";

export default function ViewToggle({ mode, onChange }: { mode: "list" | "masonry"; onChange: (m: "list" | "masonry") => void }) {
  return (
    <div className="bg-white/5 p-1 rounded-xl border border-white/8 flex gap-1">
      <button onClick={() => onChange("list")}
        className={`p-1.5 rounded-lg transition-colors ${mode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
        <LayoutList size={15} />
      </button>
      <button onClick={() => onChange("masonry")}
        className={`p-1.5 rounded-lg transition-colors ${mode === "masonry" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
        <LayoutGrid size={15} />
      </button>
    </div>
  );
}
