import { Link2, Globe } from "lucide-react";

interface LinkInputFormProps {
  linkUrl: string;
  onLinkUrlChange: (val: string) => void;
  linkLoading: boolean;
  linkMeta: any;
}

export default function LinkInputForm({
  linkUrl,
  onLinkUrlChange,
  linkLoading,
  linkMeta
}: LinkInputFormProps) {
  return (
    <div className="community-y-3">
      <div className="relative">
        <Link2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="url" placeholder="粘贴链接 (https://...)" value={linkUrl}
          onChange={(e) => onLinkUrlChange(e.target.value)}
          className="w-full bg-white/3 border border-white/8 rounded-2xl py-3.5 pl-10 pr-12
            text-[14px] text-white placeholder:text-slate-600
            focus:outline-none focus:border-white/20 transition-all" />
        {linkLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {linkMeta && (
        <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d0d] mt-3">
          {linkMeta.image && (
            <div className="w-full aspect-[2/1] overflow-hidden">
              <img src={linkMeta.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Globe size={12} className="text-slate-500 shrink-0" />
              <span className="text-[11px] text-slate-500 font-mono uppercase">{linkMeta.domain}</span>
            </div>
            <p className="text-[14px] font-bold text-white mb-1">{linkMeta.title}</p>
            {linkMeta.description && (
              <p className="text-[12px] text-slate-400 line-clamp-2">{linkMeta.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
