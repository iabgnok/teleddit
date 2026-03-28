import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import type { CommunityItem } from "@/types/community";
import { fetchApi } from "@/lib/api/client";

const COMMUNITY_META: Record<string, { emoji: string; desc: string; gradient: string }> = {
  "mock-community-001": { emoji: "⚡", desc: "Next.js 官方开发者交流社区，讨论最新特性、架构设计与踩坑经验。", gradient: "from-blue-500 to-cyan-400" },
  "mock-community-002": { emoji: "🎨", desc: "UI/UX 设计与前端视觉的聚集地，分享组件、动效与设计系统。", gradient: "from-pink-500 to-purple-500" },
  "mock-community-003": { emoji: "🤖", desc: "追踪 AI 前沿动态，测评大模型，探讨 AI 应用与伦理。", gradient: "from-emerald-500 to-teal-400" },
  "mock-community-004": { emoji: "🚀", desc: "中文独立开发者社区，分享产品复盘、增长经验与出海故事。", gradient: "from-orange-500 to-amber-400" },
};

export default function CommunityInfoCard({ space }: { space: CommunityItem | null }) {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!space || space.type !== "community" || space.id === "__saved__" || space.id === "square") return;
    
    // Check if user is in community
    const checkMembership = async () => {
      try {
        const myCommunities = await fetchApi<any[]>("/auth/me/communities");
        const joined = myCommunities.some((c: any) => c.id === space.id);
        setIsJoined(joined);
      } catch (err) {
        console.error("Failed to check membership:", err);
      }
    };
    
    checkMembership();
  }, [space?.id]);

  const toggleJoin = async () => {
    if (!space) return;
    setIsLoading(true);
    try {
      if (isJoined) {
        await fetchApi(`/communities/${space.id}/join`, { method: "DELETE" });
        setIsJoined(false);
      } else {
        await fetchApi(`/communities/${space.id}/join`, { method: "POST" });
        setIsJoined(true);
      }
    } catch (err) {
      console.error("Failed to toggle join status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!space || space.type !== "community") return null;
  const meta = COMMUNITY_META[space.id] ?? { emoji: "🔥", desc: "论坛社区", gradient: "from-orange-500 to-red-500" };
  
  return (
    <div className="rounded-2xl bg-[#1b1b1b] border border-white/5 shadow-xl overflow-hidden">
      {/* 渐变头部 */}
      <div className={`h-16 bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-3xl`}>
        {meta.emoji}
      </div>
      <div className="p-5">
        <h2 className="font-black text-base mb-1.5 tracking-tight">
          {space.id === "__saved__" || space.id === "square" ? space.name : `r/${space.name}`}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{meta.desc}</p>
        {space.memberCount !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Users size={13} />
            {space.memberCount.toLocaleString()} 位成员
          </div>
        )}
        {space.id !== "__saved__" && space.id !== "square" && (
          <button 
            onClick={toggleJoin}
            disabled={isLoading}
            className={`w-full font-black py-2.5 rounded-xl text-sm transition-all
              ${isJoined 
                ? "bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-white/10 hover:border-red-500/30" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isLoading ? "处理中..." : (isJoined ? "退出社区" : "加入社区")}
          </button>
        )}
      </div>
    </div>
  );
}
