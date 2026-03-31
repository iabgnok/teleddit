"use client";

// ════════════════════════════════════════════════════════════════════════
// 📌 统一侧边栏组件 (UnifiedSidebar)
// 负责应用左侧的导航、社区列表、状态管理及相关的折叠与悬浮操作
// ════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import {
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Bookmark,
  User,
} from "lucide-react";

import type { CommunityItem } from "@/types/community";
import type { FolderItem } from "@/types/folder";
import { useCommunities } from "@/hooks/useCommunities";
import { useFolders } from "@/hooks/useFolders";
import { DEFAULT_FOLDERS } from "@/lib/mock/communities";

import { CommunityContextMenu, type ContextMenuState } from "@/components/features/community/CommunityContextMenu";
import { FolderEditModal } from "@/components/features/community/FolderEditModal";
import { CreateCommunityModal } from "@/components/features/community/CreateCommunityModal";
import { CommunityManageModal } from "@/components/features/community/CommunityManageModal";
import SearchBar from "@/components/layout/sidebar/SearchBar";
import FolderTabs from "@/components/layout/sidebar/FolderTabs";
import { communityApi } from "@/lib/api/community";

// 引入拆分的子组件
import { SectionGroup } from "./components/SectionGroup";
import { PinnedItem } from "./components/PinnedItem";
import { FloatingActionButton } from "./components/FloatingActionButton";

// ════════════════════════════════════════════════════════════
// 📌 SECTION 1: 类型与常量配置
// ════════════════════════════════════════════════════════════
const TYPE_GRADIENT: Record<string, string> = {
  community: "from-orange-500 to-red-500",
};

// Saved Messages 空间常量（系统内置，类似 Telegram）
const SAVED_SPACE: CommunityItem = {
  id: "__saved__",
  type: "community",
  name: "已收藏",
  lastPreviewText: "保存的消息和笔记",
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
};

const MY_POSTS_SPACE: CommunityItem = {
  id: "__my_posts__",
  type: "community",
  name: "我的帖子",
  lastPreviewText: "我发布的帖文",
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
};

// ════════════════════════════════════════════════════════════
// 📌 SECTION 2: Props 定义
// ════════════════════════════════════════════════════════════
interface UnifiedSidebarProps {
  selectedCommunityId: string | null;
  onSelectSpace: (community: CommunityItem | null) => void;
  onCreatePost?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// ════════════════════════════════════════════════════════════
// 📌 SECTION 3: 主组件 (UnifiedSidebar)
// ════════════════════════════════════════════════════════════
export function UnifiedSidebar({
  selectedCommunityId,
  onSelectSpace,
  onCreatePost,
  collapsed,
  onToggleCollapse,
}: UnifiedSidebarProps) {
  const { communities, loading, refetch: fetchCommunities, updateCommunityLocally } = useCommunities();

  // ── 文件夹状态（改为从 API Hook 获取）───────────────────────
  const { folders, saveFolder, deleteFolder, addSpaceToFolder, removeSpaceFromFolder } = useFolders();
  const [activeFolderId, setActiveFolderId] = useState("folder-all");
  const [editingFolder, setEditingFolder] = useState<FolderItem | null | "new">(undefined as any);
  const showFolderModal = editingFolder !== undefined;
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);  
  const [searchQuery, setSearchQuery] = useState('');  
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [manageCommunity, setManageCommunity] = useState<CommunityItem | null>(null);

  // ── 根据当前文件夹 + 搜索 过滤 communities ────────────────────
  const filteredSpaces = useMemo(() => {
    const folder = folders.find((f) => f.id === activeFolderId);
    let base = communities;
    
    if (folder && folder.communityIds.length > 0) {
      base = base.filter((s) => folder.communityIds.includes(s.id));
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((s) => 
        s.name.toLowerCase().includes(q) || 
        s.lastPreviewText?.toLowerCase().includes(q)
      );
    }

    // 复制数组后再排序，防止污染原状态，置顶社区优先
    return [...base].sort((a, b) => {
      const aPinned = a.isPinned || false;
      const bPinned = b.isPinned || false;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return 0;
    });
  }, [communities, activeFolderId, searchQuery, folders]);

  // ── 按类型分组 ────────────────────────────────────────────
  const grouped = useMemo(() => ({
    communities: filteredSpaces.filter((s) => s.type === "community"),
  }), [filteredSpaces]);

  // ── 文件夹操作 (已经被提取进 useFolders API HOOK) ────────────────────────────────────────────

  // ── 右键菜单 API 调用 ──────────────────────────────────────────
  const handlePin = async (community: CommunityItem) => {
    try {
      const targetState = !community.isPinned;
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isPinned: targetState });
      await communityApi.updatePreferences(community.id, { is_pinned: targetState });
      if (fetchCommunities) fetchCommunities();
    } catch (err: any) {
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isPinned: community.isPinned }); // revert
      alert("操作失败: " + err.message);
    }
  };

  const handleMute = async (community: CommunityItem) => {
    try {
      const targetState = !community.isMuted;
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isMuted: targetState });
      await communityApi.updatePreferences(community.id, { is_muted: targetState });
      if (fetchCommunities) fetchCommunities();
    } catch (err: any) {
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isMuted: community.isMuted });
      alert("操作失败: " + err.message);
    }
  };

  const handleArchive = async (community: CommunityItem) => {
    try {
      const targetState = !community.isArchived;
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isArchived: targetState });
      await communityApi.updatePreferences(community.id, { is_archived: targetState });
      if (fetchCommunities) fetchCommunities();
    } catch (err: any) {
      if (updateCommunityLocally) updateCommunityLocally(community.id, { isArchived: community.isArchived });
      alert("操作失败: " + err.message);
    }
  };

  const handleLeave = async (community: CommunityItem) => {
    if (!confirm(`确定要退出社区 "${community.name}" 吗？`)) return;
    try {
      await communityApi.leaveCommunity(community.id);
      if (fetchCommunities) fetchCommunities();
      if (selectedCommunityId === community.id) {
         window.location.hash = ""; // Clear hash or redirect to square if selected
         onSelectSpace(null);
      }
    } catch (err: any) {
      alert("退出失败: " + err.message);
    }
  };

  // ── 右键菜单 ──────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, community: CommunityItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, community });
  }, []);

  // ════════════════════════════════════════════════════════
  // 📌 视图：折叠态
  // ════════════════════════════════════════════════════════
  if (collapsed) {
    return (
      <aside className="w-14 shrink-0 flex flex-col items-center bg-[#1a1a1b]
        border-r border-white/10 py-3 gap-2.5 overflow-hidden">
        <button onClick={onToggleCollapse} title="展开侧栏"
          className="w-9 h-9 flex items-center justify-center rounded-xl
            text-slate-400 hover:text-white hover:bg-white/8 transition-all">
          <PanelLeftOpen size={20} />
        </button>
        <button onClick={() => onSelectSpace(null)} title="首页"
          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all
            bg-gradient-to-br from-blue-500 to-indigo-600
            ${selectedCommunityId === null ? "ring-2 ring-blue-400" : "hover:ring-2 hover:ring-white/20"}`}>
          <Home size={17} className="text-white" />
        </button>
        <div className="w-6 h-px bg-white/10" />
        <div className="flex flex-col gap-2 items-center overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {communities.slice(0, 8).map((community) => {
            const grad = TYPE_GRADIENT[community.type] || "from-slate-500 to-slate-700";
            return (
              <button key={community.id} onClick={() => onSelectSpace(community)} title={community.name}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center
                  text-[11px] font-black text-white bg-gradient-to-br ${grad} transition-all
                  ${community.id === selectedCommunityId ? "ring-2 ring-blue-400" : "hover:ring-2 hover:ring-white/20"}`}>
                {community.name.slice(0, 2).toUpperCase()}
                {community.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full
                    bg-red-500 border border-[#1b1b1b] text-[8px] flex items-center justify-center font-black">
                    {community.unreadCount > 9 ? "9+" : community.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // ════════════════════════════════════════════════════════
  // 📌 视图：展开态
  // ════════════════════════════════════════════════════════
  return (
    <>
      {/* 侧栏：用 relative + 不设 overflow-hidden，FAB 在内部定位 */}
      <aside className="w-72 shrink-0 flex flex-col bg-[#1a1a1b] border-r border-white/10 relative group/sidebar">

        {/* ── 侧边栏顶部操作区 ── */}
        <div className="h-12 px-3 flex items-center justify-between shrink-0 border-b border-white/5">
          <button onClick={onToggleCollapse} title="折叠侧栏"
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <PanelLeftClose size={18} />
          </button>
          <button title="设置"
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <Settings size={16} />
          </button>
        </div>

        {/* ── 文件夹 Tab 栏 ── */}
        <FolderTabs
          folders={folders}
          activeId={activeFolderId}
          onSelect={setActiveFolderId}
          communities={communities}
          onEdit={(f) => setEditingFolder(f)}
          onAdd={() => setEditingFolder(null)}
        />

        {/* ── 可滚动列表 ── */}
        <div className="flex-1 overflow-y-auto pb-20" style={{ scrollbarWidth: "none" }}>

          {/* 主页 + Saved Messages：固定在最顶部，跟随列表滚动 */}
          <PinnedItem
            icon={<Home size={18} className="text-white" />}
            label="首页"
            desc="所有社区的帖文"
            gradient="from-blue-500 to-indigo-600"
            isActive={selectedCommunityId === null}
            onClick={() => onSelectSpace(null)}
          />
          <PinnedItem
            icon={<Bookmark size={16} className="text-white" />}
            label="已收藏"
            desc="保存的消息和笔记"
            gradient="from-amber-500 to-orange-500"
            isActive={selectedCommunityId === SAVED_SPACE.id}
            onClick={() => onSelectSpace(SAVED_SPACE)}
            onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e, SAVED_SPACE); }}
          />
          <PinnedItem
            icon={<User size={16} className="text-white" />}
            label="我的帖子"
            desc="我发布的帖文"
            gradient="from-emerald-500 to-teal-600"
            isActive={selectedCommunityId === MY_POSTS_SPACE.id}
            onClick={() => onSelectSpace(MY_POSTS_SPACE)}
            onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e, MY_POSTS_SPACE); }}
          />
          <div className="mx-3 my-1 h-px bg-white/5" />

          {loading ? (
            <div className="px-3 pt-3 space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded-lg w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-1">
              <SectionGroup 
                title="社区" 
                communities={grouped.communities}
                selectedId={selectedCommunityId} 
                onSelect={onSelectSpace} 
                onContextMenu={handleContextMenu} 
              />

              {searchQuery && filteredSpaces.length === 0 && (
                <p className="text-center text-xs text-slate-600 py-8">没有找到「{searchQuery}」</p>
              )}
            </div>
          )}
        </div>

        {/* ── FAB：悬浮在侧栏右下角，hover 时显示 ── */}
        <div className="absolute bottom-5 right-4 z-20
          opacity-0 group-hover/sidebar:opacity-100
          transition-opacity duration-200 pointer-events-none
          group-hover/sidebar:pointer-events-auto">
          <FloatingActionButton 
            onOpenFolderCreate={() => setEditingFolder(null)} 
            onOpenCommunityCreate={() => setShowCreateCommunity(true)}
          />
        </div>
      </aside>

      {/* 右键菜单 */}
      {contextMenu && (
        <CommunityContextMenu
          state={contextMenu}
          folders={folders}
          onClose={() => setContextMenu(null)}
          onMarkRead={() => {}}
          onPin={handlePin}
          onMute={handleMute}
          onArchive={handleArchive}
          onLeave={handleLeave}
          onAddToFolder={addSpaceToFolder}
          onRemoveFromFolder={removeSpaceFromFolder}
          onManage={(community) => setManageCommunity(community)}
          onCreateFolderWith={(community) => {
            setEditingFolder(null);
            // TODO: 预填 communityIds = [community.id]
          }}
        />
      )}

      {/* 文件夹编辑弹窗 */}
      {showFolderModal && (
        <FolderEditModal
          folder={editingFolder === null ? null : (editingFolder as FolderItem)}
          communities={communities}
          onSave={saveFolder}
          onDelete={deleteFolder}
          onClose={() => setEditingFolder(undefined as any)}
        />
      )}

      {/* 创建社区弹窗 */}
      {showCreateCommunity && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* 社区管理弹窗 */}
      {manageCommunity && (
        <CommunityManageModal
          community={manageCommunity}
          onClose={() => setManageCommunity(null)}
          onUpdated={() => {
            // refresh data if needed, or window reload
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
