"use client";

import { useEffect, useState, useCallback } from "react";
import type { CommunityItem, SidebarFilter } from "@/types/community";
import { MOCK_SPACES } from "@/lib/mock/communities";
import { fetchApi } from "@/lib/api/client";

const USE_MOCK = false;

const DEFAULT_SQUARE: CommunityItem = {
  id: "square",
  type: "community",
  name: "广场",
  lastActivityAt: new Date().toISOString(),
  lastPreviewText: "默认的公共交流区",
  unreadCount: 0,
  memberCount: 0,
};

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
        myRole: community.role, // from backend UserCommunityResponse
        visibility: community.visibility,
        postPermission: community.postPermission,
        commentPermission: community.commentPermission,
        joinMode: community.joinMode,
        isPinned: community.isPinned ?? community.is_pinned ?? false,
        isMuted: community.isMuted ?? community.is_muted ?? false,
        isArchived: community.isArchived ?? community.is_archived ?? false,
      }));

      const hasSquare = mappedSpaces.some(s => s.id === "square");
      if (!hasSquare) {
        mappedSpaces.unshift(DEFAULT_SQUARE);
      }

      setAllSpaces(mappedSpaces);
    } catch (err: any) {
      console.error("[useCommunities] 获取数据失败:", err);
      if (err?.message?.includes("401") || err?.message?.includes("Not authenticated") || err?.message?.includes("fetch")) {
        setAllSpaces([DEFAULT_SQUARE]);
      } else {
        setError(err?.message ?? "未知错误");
        // 保底展示广场
        setAllSpaces([DEFAULT_SQUARE]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const markAsRead = useCallback((communityId: string) => {
    setAllSpaces((prev) =>
      prev.map((s) => (s.id === communityId ? { ...s, unreadCount: 0 } : s))    
    );
  }, []);

  const updateCommunityLocally = useCallback((communityId: string, updates: Partial<CommunityItem>) => {
    setAllSpaces((prev) =>
      prev.map((s) => (s.id === communityId ? { ...s, ...updates } : s))
    );
  }, []);

  const filterSpaces = useCallback(
    (filter: SidebarFilter): CommunityItem[] => {
      if (filter === "all") return allSpaces;
      return allSpaces.filter((s) => s.type === filter);
    },
    [allSpaces]
  );

  return { communities: allSpaces, loading, error, refetch: fetchCommunities, markAsRead, updateCommunityLocally, filterSpaces };
}
