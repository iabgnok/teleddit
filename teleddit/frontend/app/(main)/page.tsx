"use client";

// app/(main)/page.tsx
// ════════════════════════════════════════════════════════════════════════
// 📌 主页面组件 (Home) - 负责页面整体状态管理与布局拼装
// ════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { Plus, Bell } from "lucide-react";

import PostModal from "@/components/features/post/PostModal";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import ListFeed from "@/components/features/feed/ListFeed";
import MasonryFeed from "@/components/features/feed/MasonryFeed";
import { UnifiedSidebar } from "@/components/layout/sidebar/UnifiedSidebar";
import UserMenu from "@/components/features/user/UserMenu";
import SortDropdown from "@/components/features/feed/SortDropdown";
import ViewToggle from "@/components/features/feed/ViewToggle";
import CommunityInfoCard from "@/components/features/community/CommunityInfoCard";
import SpaceTitle from "@/components/features/community/SpaceTitle";

import { fetchApi } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityItem } from "@/types/community";
import { COMMUNITY_POSTS, ALL_MOCK_POSTS } from "@/lib/mock/communityPosts";
import { sortPosts, type SortKey } from "@/lib/utils/sort";
import { PostContextMenu, PostContextMenuState } from "@/components/features/post/PostContextMenu";
import "./masonry.css";

// ─── 社区是否有 mock 数据 ─────────────────────────────────────
const MOCK_COMMUNITY_IDS = new Set(Object.keys(COMMUNITY_POSTS));

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCommunity, setSelectedCommunity]       = useState<CommunityItem | null>(null);
  const [selectedPost, setSelectedPost]         = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<PostContextMenuState | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMounted, setIsMounted]               = useState(false);
  const [realPosts, setRealPosts]               = useState<any[]>([]);
  const [sort, setSort]                         = useState<SortKey>("best");
  const [viewMode, setViewMode]                 = useState<"list" | "masonry">("masonry");
  const { user, loading: authLoading } = useAuth(); // 从 AuthContext 获取真实用户

  // 拉真实帖文（主页 + 无 mock 数据的社区使用）
  const fetchRealPosts = async () => {
    try {
      const isSaved = selectedCommunity?.id === "__saved__";
      const isMyPosts = selectedCommunity?.id === "__my_posts__";
      
      const queryParams = new URLSearchParams();
      if (isSaved) queryParams.append("saved_only", "true");
      if (isMyPosts) queryParams.append("my_posts_only", "true");
      const qs = queryParams.toString();

      const data = await fetchApi<any[]>(`/posts${qs ? `?${qs}` : ""}`, { requireAuth: isSaved || isMyPosts });
      setRealPosts((data || []).map((p: any) => ({
        ...p,
        userDownvoted: p.userVoted === -1,
      })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchRealPosts();
  }, [selectedCommunity?.id]); // 当选中社区变化时重新拉取

  // ★ 根据当前选中空间决定用哪套帖文
  const activePosts = useMemo(() => {
    if (!selectedCommunity || selectedCommunity.type !== "community") {
      // 主页：真实帖文 + 所有 mock 社区帖文混合
      return [...realPosts, ...ALL_MOCK_POSTS];
    }
    if (selectedCommunity.id === "__saved__" || selectedCommunity.id === "__my_posts__") {
      return realPosts;
    }
    if (MOCK_COMMUNITY_IDS.has(selectedCommunity.id)) {
      // 有 mock 数据的社区：只显示该社区的帖文
      return COMMUNITY_POSTS[selectedCommunity.id];
    }
    // 真实社区（数据库里的）：从真实帖文里过滤
    return realPosts.filter((p: any) => p.community_id === selectedCommunity.id || p.community?.id === selectedCommunity.id);
  }, [selectedCommunity, realPosts]);

  const sortedPosts = useMemo(() => sortPosts(activePosts, sort), [activePosts, sort]);

  const handleFavorite = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchApi(`/posts/${postId}/favorite`, { method: "POST" });
      alert("已收藏");
    } catch (err) {
      console.error("收藏失败", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("确定要删除该帖子吗？删除后无法恢复。")) return;
    try {
      await fetchApi(`/posts/${postId}`, { method: "DELETE" });
      setRealPosts((prev) => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(`删除失败: ${err.message}`);
    }
  };

  const handleVote = async (postId: any, type: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let finalVoteType = type;

    // 乐观更新 UI
    setRealPosts((prev) => prev.map(p => {
      if (p.id !== postId) return p;
      let newUpvotes = p.upvotes;
      let newDownvotes = p.downvotes;
      let newUserVoted = p.user_voted || 0;

      // 如果点击的类型和当前已投票的类型相同，说明是取消投票
      if (newUserVoted === type) {
        if (type === 1) { newUpvotes--; p.votes--; }
        if (type === -1) { newDownvotes--; p.votes++; }
        newUserVoted = 0;
      } else {
        // 撤销之前的投票（如果有的话）
        if (newUserVoted === 1) newUpvotes--;
        if (newUserVoted === -1) newDownvotes--;

        // 应用新投票
        newUserVoted = type;
        if (type === 1) newUpvotes++;
        if (type === -1) newDownvotes++;
      }

      finalVoteType = newUserVoted;

      return {
        ...p,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        user_voted: newUserVoted,
        user_downvoted: newUserVoted === -1,
      };
    }));

    // 发起请求
    try {
      await fetchApi(`/posts/${postId}/vote`, {
        method: "POST",
        body: JSON.stringify({ vote_type: finalVoteType })
      });
    } catch (err) {
      console.error("投票失败", err);
      // 失败的话应该回滚，这里简单处理，重新拉取
      fetchRealPosts();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, post: any) => {
    e.preventDefault(); // 阻止默认右键菜单
    setContextMenu({ x: e.clientX, y: e.clientY, post });
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-black text-slate-200 overflow-hidden font-sans">

      {/* ── 左侧栏 ───────────────────────── */}
      <UnifiedSidebar
        selectedCommunityId={selectedCommunity?.id ?? null}
        onSelectSpace={(space) => setSelectedCommunity(space)}
        onCreatePost={() => setIsCreateModalOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* ── 中间内容区 ───────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-[#0d0d0d] border-r border-white/8">

        {/* Header */}
        <header className="h-14 shrink-0 bg-[#0d0d0d]/90 backdrop-blur-xl
          border-b border-white/5 px-5 flex items-center justify-between z-50">
          <SpaceTitle space={selectedCommunity} />
          <div className="flex items-center gap-3">
            <SortDropdown current={sort} onChange={setSort} />
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <Bell size={17} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            ) : user?.email ? (
              <UserMenu userEmail={user.email} />
            ) : (
              <a
                href="/login"
                className="h-8 px-3 rounded-full bg-blue-600 hover:bg-blue-500
                  text-white text-[13px] font-bold flex items-center transition-colors"
              >
                登录
              </a>
            )}
          </div>
        </header>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 px-4">
            {viewMode === "list" ? (
              <ListFeed
                posts={sortedPosts}
                onSelectPost={setSelectedPost}
                onVote={handleVote}
                formatVotes={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                  return String(v);
                }}
                onSelectCommunity={(communityId) => {
                  const space = activePosts.find(p => p.community_id === communityId)?.community_id || communityId;
                  setSelectedCommunity({ id: space, type: "community", name: activePosts.find(p => p.community_id === communityId)?.community || "未知" } as any);
                }}
                onContextMenu={handleContextMenu}
              />
            ) : (
              <MasonryFeed
                posts={sortedPosts}
                onSelectPost={setSelectedPost}
                onVote={handleVote}
                formatVotes={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                  return String(v);
                }}
                onSelectCommunity={(communityId) => {
                  const space = activePosts.find(p => p.community_id === communityId)?.community_id || communityId;
                  setSelectedCommunity({ id: space, type: "community", name: activePosts.find(p => p.community_id === communityId)?.community || "未知" } as any);
                }}
                onContextMenu={handleContextMenu}
              />
            )}
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-[300px] w-[52px] h-[52px]
            bg-blue-600 hover:bg-blue-500 text-white rounded-full
            flex items-center justify-center shadow-2xl shadow-blue-600/30
            z-50 transition-all hover:scale-110 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </main>

      {/* ── 右侧栏 ───────────────────────── */}
      <aside className="w-[272px] p-4 hidden xl:flex flex-col gap-4 bg-[#0a0a0a] shrink-0">
        {selectedCommunity?.type === "community" && !["__saved__", "__my_posts__", "square"].includes(selectedCommunity.id) ? (
          <CommunityInfoCard space={selectedCommunity} />
        ) : (
          <div className="rounded-2xl bg-[#1b1b1b] p-5 border border-white/5">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3">发现</p>
            <p className="text-xs text-slate-600 leading-relaxed">从左侧选择一个社区或群组开始探索</p>
          </div>
        )}
      </aside>

      {/* 弹窗 */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPublish={fetchRealPosts}
      />
      <PostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onCommentCountChange={() => {}}
      />
      
      {contextMenu && (
        <PostContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onVote={handleVote}
          onFavorite={handleFavorite}
          onComment={setSelectedPost}
          onDelete={handleDeletePost}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}
