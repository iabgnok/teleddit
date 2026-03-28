import { Hash, Users } from "lucide-react";
import type { CommunityItem } from "@/types/community";

const TYPE_ICON: Record<string, React.ElementType> = {
  community: Hash
};

export default function SpaceTitle({ space }: { space: CommunityItem | null }) {
  if (!space) return <span className="font-bold text-base text-white">首页</span>;
  
  const Icon = TYPE_ICON[space.type] || Hash;
  
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-slate-400 shrink-0" />
      <span className="font-bold text-base text-white truncate">
        {space.type === "community" ? `r/${space.name}` : space.name}
      </span>
      {space.memberCount !== undefined && space.type === "community" && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 ml-1">
          <Users size={11} />
          {space.memberCount.toLocaleString()}
        </span>
      )}
    </div>
  );
}
