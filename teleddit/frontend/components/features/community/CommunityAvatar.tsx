"use client";

// components/sidebar/CommunityAvatar.tsx
// 根据 CommunityItem 的 type 渲染对应样式的头像。
// community  → 方圆角，社区色块 / 图片
// direct     → 圆形 + 在线绿点
// group      → 圆形群组
// channel    → 方圆角 + 喇叭角标
// aggregate  → 双图标叠加徽章

import type { CommunityItem, SpaceType } from "@/types/community";

// 每种类型的默认渐变色（当没有 avatarUrl 时使用首字母色块）
const GRADIENT_MAP: Record<SpaceType, string> = {
  community: "from-orange-500 to-red-500",
};

const SHAPE_MAP: Record<SpaceType, string> = {
  community: "rounded-2xl",
};

function getInitials(name: string): string {
  return name
    .replace(/^r\//, "")  // 去掉 community 的 r/ 前缀
    .slice(0, 2)
    .toUpperCase();
}

// ─── 右下角修饰（原本给频道等预留） ──────────
function SpecialBadge() {
  return null;
}

// ─── 主组件 ────────────────────────────
export function CommunityAvatar({ community }: { community: CommunityItem }) {
  const gradient = GRADIENT_MAP[community.type] || "from-slate-500 to-slate-700";
  const shape    = SHAPE_MAP[community.type] || "rounded-xl";
  const initials = getInitials(community.name);

  return (
    <div className="relative w-11 h-11 shrink-0">
      {/* 主体头像 */}
      <div
        className={`w-full h-full bg-gradient-to-br ${gradient} ${shape}
          flex items-center justify-center text-white font-bold text-sm
          overflow-hidden shadow-md`}
      >
        {community.avatarUrl ? (
          <img
            src={community.avatarUrl}
            alt={community.name}
            className={`w-full h-full object-cover ${shape}`}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
}