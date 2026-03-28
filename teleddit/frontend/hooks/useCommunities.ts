"use client";

import { useEffect, useState, useCallback } from "react";
import type { CommunityItem, SidebarFilter } from "@/types/community";
import { MOCK_SPACES } from "@/lib/mock/communities";
import { fetchApi } from "@/lib/api/client";

const USE_MOCK = false;

export function useCommunities() {
  const [allSpaces, setAllSpaces] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      setAllSpaces(MOCK_SPACES);
      setLoading(false);
      return;
    }

    try {
      // 从我们自己的 Python FastAPI 获取 community 列表
      // (将来还需要合并成包含 DMs/Channels 等等的话再做聚合)
      const data = await fetchApi<any[]>("/auth/me/communities", { requireAuth: true });
      
      const mappedSpaces: CommunityItem[] = data.map((community) => ({
        id: community.id,
        type: "community",
        name: community.name,
        avatarUrl: community.avatarUrl,
        lastActivityAt: community.lastActivityAt || new Date().toISOString(),
        lastPreviewText: community.description || "新社区",
        unreadCount: community.unreadCount || 0,
        memberCount: community.memberCount,
      }));

      // 插入默认的广场社区
      const hasSquare = mappedSpaces.some(s => s.id === "square");
      if (!hasSquare) {
        mappedSpaces.unshift({
          id: "square",
          type: "community",
          name: "广场",
          lastActivityAt: new Date().toISOString(),
          lastPreviewText: "默认的公共交流区",
          unreadCount: 0,
          memberCount: 0,
        });
      }

      setAllSpaces(mappedSpaces);
    } catch (err: any) {
      console.error("[useCommunities] 获取数据失败:", err);
      // 未登录静默拦截
      if (err?.message?.includes("401") || err?.message?.includes("Not authenticated")) {
        setAllSpaces([]);
      } else {
        setError(err?.message ?? "未知错误");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // 临时：标记已读
  const markAsRead = useCallback((communityId: string) => {
    setAllSpaces((prev) =>
      prev.map((s) => (s.id === communityId ? { ...s, unreadCount: 0 } : s))
    );
  }, []);

  const filterSpaces = useCallback(
    (filter: SidebarFilter): CommunityItem[] => {
      if (filter === "all") return allSpaces;
      return allSpaces.filter((s) => s.type === filter);
    },
    [allSpaces]
  );

  return { communities: allSpaces, loading, error, refetch: fetchCommunities, markAsRead, filterSpaces };
}
