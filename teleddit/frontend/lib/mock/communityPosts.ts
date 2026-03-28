// lib/mock/communityPosts.ts
// 按 community id 返回对应社区的模拟帖文数据
// 帖文结构与真实 /api/posts 返回格式保持一致，可直接传给 ListFeed / MasonryFeed

export type PostContentType = "text" | "media" | "link" ;


export interface MockPost {
  id: string;
  title: string;
  content?: string;
  author: string;
  author_id: string;
  community: string;       // 社区显示名
  post_type?: string;      // 顶部标签文字（DISCUSSION / TUTORIAL 等）
  content_type: PostContentType; // ★ 帖文内容类型（text/media/link）
  cover_url?: string;
  media_urls?: string[];   // ★ media 类型：多张图片
  link_url?: string;       // ★ link 类型：目标 URL
  link_meta?: {            // ★ link 类型：预览元数据
    title: string;
    description?: string;
    image?: string;
    domain: string;
    favicon?: string;
  };
  upvotes: number;
  downvotes: number;
  votes: number;
  comment_count: number;
  user_voted: number;
  user_downvoted: boolean;
  created_at: string;
  tags?: string[];
}

// ── 工具 ────────────────────────────────────────────────────
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3600000).toISOString();
}

// ── r/nextjs_dev (mock-community-001) ──────────────────────
const POSTS_NEXTJS: MockPost[] = [
  {
    id: "nj-001",
    title: "App Router 中如何优雅处理全局 Loading UI？实测 3 种方案对比",
    content: "最近在把项目从 Pages Router 迁移到 App Router，发现 loading.tsx 的嵌套行为和想象的不太一样。Suspense boundary 的粒度控制、Streaming SSR 和骨架屏的配合方式，我整理了三种方案的优劣。方案一是全局 layout 层的 loading.tsx，优点是零配置，缺点是粒度太粗；方案二是 per-route Suspense，灵活但需要手动包裹每个异步组件；方案三是结合 useFormStatus 做局部加载态，适合表单场景。",
    author: "liming_dev",
    author_id: "uid-liming",
    community: "nextjs_dev",
    post_type: "DISCUSSION",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/nj001/800/450",
    upvotes: 412,
    downvotes: 8,
    votes: 412,
    comment_count: 67,
    user_voted: 0,
    user_downvoted: false,
    created_at: hoursAgo(2),
    tags: ["App Router", "Loading UI", "Next.js 15"],
  },
  {
    id: "nj-002",
    title: "Turbopack 在生产环境稳定了吗？250+ 包的 monorepo 实测",
    content: "我们团队在 250+ 包的 monorepo 中实测了 Turbopack，初始编译从 Webpack 的 87 秒降到 23 秒。HMR 速度提升更明显，从平均 1.2s 降到 180ms。但在某些动态 import 场景仍有 bug，建议生产环境谨慎使用。",
    author: "zhangwei_fe",
    author_id: "uid-zhangwei",
    community: "nextjs_dev",
    post_type: "BENCHMARK",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/nj002/800/450",
    upvotes: 289,
    downvotes: 22,
    votes: 289,
    comment_count: 43,
    user_voted: 0,
    user_downvoted: false,
    created_at: hoursAgo(8),
    tags: ["Turbopack", "monorepo", "性能"],
  },
  {
    id: "nj-003",
    title: "Vercel 发布 Next.js 15.2：Server Actions 性能大幅提升",
    content: "",
    author: "nextjs_official",
    author_id: "uid-nextjsofficial",
    community: "nextjs_dev",
    post_type: "NEWS",
    content_type: "link",
    link_url: "https://nextjs.org/blog/next-15-2",
    link_meta: {
      title: "Next.js 15.2",
      description: "Server Actions latency improvements, improved error overlay, React View Transitions (experimental), and more.",
      image: "https://picsum.photos/seed/nj003link/1200/630",
      domain: "nextjs.org",
      favicon: "https://nextjs.org/favicon.ico",
    },
    upvotes: 534,
    downvotes: 5,
    votes: 534,
    comment_count: 91,
    user_voted: 1,
    user_downvoted: false,
    created_at: daysAgo(1),
    tags: ["Next.js 15", "Release", "Server Actions"],
  },
  {
    id: "nj-005",
    title: "我的 Next.js + Supabase 全栈模板开源了！含完整 Auth / RBAC / 支付",
    content: "",
    author: "lihua_fullstack",
    author_id: "uid-lihua",
    community: "nextjs_dev",
    post_type: "SHOWCASE",
    content_type: "media",
    media_urls: [
      "https://picsum.photos/seed/nj005a/800/600",
      "https://picsum.photos/seed/nj005b/800/600",
      "https://picsum.photos/seed/nj005c/800/600",
      "https://picsum.photos/seed/nj005d/800/600",
    ],
    upvotes: 723,
    downvotes: 11,
    votes: 723,
    comment_count: 138,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(3),
    tags: ["开源", "模板", "全栈", "Supabase"],
  },
  {
    id: "nj-006",
    title: "Next.js 15 中 cookies() / headers() 为什么变成异步了？",
    content: "升级到 Next.js 15 后，原来同步的 cookies() 和 headers() 全报错了，需要加 await，这个 Breaking Change 背后的设计原因是什么？",
    author: "chenxiaoyu_dev",
    author_id: "uid-chenxiaoyu",
    community: "nextjs_dev",
    post_type: "QUESTION",
    content_type: "text",
    upvotes: 95,
    downvotes: 2,
    votes: 95,
    comment_count: 18,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(4),
    tags: ["Next.js 15", "Breaking Change"],
  },
];

// ── r/ui_design (mock-community-002) ────────────────────────
const POSTS_UI_DESIGN: MockPost[] = [
  {
    id: "ui-001",
    title: "分享一套完整的暗色主题 Tailwind 组件库，共 40+ 个组件全部开源",
    content: "历时 4 个月，整理了一套真正生产可用的暗色主题组件库。所有组件基于 Tailwind CSS + shadcn/ui 基础层重新设计，覆盖 Form、Table、Chart、Modal、Toast 等常见场景。特别注重可访问性（WCAG AA 达标）和主题切换流畅度。",
    author: "wangfang_ui",
    author_id: "uid-wangfang",
    community: "ui_design",
    post_type: "RESOURCE",
    content_type: "media",
    media_urls: [
      "https://picsum.photos/seed/ui001a/800/500",
      "https://picsum.photos/seed/ui001b/800/500",
      "https://picsum.photos/seed/ui001c/800/500",
    ],
    upvotes: 1204,
    downvotes: 14,
    votes: 1204,
    comment_count: 203,
    user_voted: 1,
    user_downvoted: false,
    created_at: hoursAgo(5),
    tags: ["Tailwind", "组件库", "开源", "暗色主题"],
  },
  {
    id: "ui-002",
    title: "Glassmorphism 在 2025 年还值得用吗？深度分析与实用场景",
    content: "玻璃拟态在 2021 年火了一阵，然后被批评为可读性差、滥用。但我发现在特定场景——比如叠加在模糊背景上的浮层组件——它依然是最优解。本文分析 3 个适用场景和 3 个应该避免的场景，附带可访问性检查清单。",
    author: "lihua_design",
    author_id: "uid-lihua",
    community: "ui_design",
    post_type: "OPINION",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/ui002/800/500",
    upvotes: 456,
    downvotes: 89,
    votes: 456,
    comment_count: 112,
    user_voted: 0,
    user_downvoted: false,
    created_at: hoursAgo(12),
    tags: ["Glassmorphism", "设计趋势"],
  },
  {
    id: "ui-004",
    title: "Shadcn/ui 发布全新 sidebar 组件，这次真的可以直接用了",
    content: "",
    author: "designer_hacker",
    author_id: "uid-dh",
    community: "ui_design",
    post_type: "NEWS",
    content_type: "link",
    link_url: "https://ui.shadcn.com/docs/components/sidebar",
    link_meta: {
      title: "Sidebar - shadcn/ui",
      description: "A composable, themeable and customizable sidebar component built with Radix UI.",
      image: "https://picsum.photos/seed/ui004link/1200/630",
      domain: "ui.shadcn.com",
    },
    upvotes: 334,
    downvotes: 12,
    votes: 334,
    comment_count: 78,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(2),
    tags: ["shadcn/ui", "组件"],
  },
  {
    id: "ui-005",
    title: "响应式字体排版终极指南：clamp()、viewport units 与 CSS Grid 的组合使用",
    content: "流体排版的核心是让字号随视口平滑缩放，而不是在断点处突变。这篇文章系统讲解 clamp() 的三参数计算公式、CSS Grid 的内容宽度约束，以及如何在不破坏可读性的前提下实现极端响应式。",
    author: "wangfang_ui",
    author_id: "uid-wangfang",
    community: "ui_design",
    post_type: "DEEP DIVE",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/ui005/800/480",
    upvotes: 612,
    downvotes: 4,
    votes: 612,
    comment_count: 89,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(3),
    tags: ["Typography", "CSS", "响应式"],
  },
];

// ── r/ai_frontier (mock-community-003) ─────────────────────
const POSTS_AI: MockPost[] = [
  {
    id: "ai-001",
    title: "Claude 3.7 Sonnet 实测：Extended Thinking 在代码审查上的表现让我惊了",
    content: "我用 Claude 3.7 的 Extended Thinking 模式审查了我们产品核心模块的 2000 行 TypeScript 代码。它不仅找出了一个隐藏了 3 个月的竞态条件 bug，还给出了完整的修复方案和回归测试用例。整个过程耗时 47 秒，但思考链展示了它是怎么一步步推导的，非常值得读。",
    author: "ai_explorer_cn",
    author_id: "uid-aiexplorer",
    community: "ai_frontier",
    post_type: "REVIEW",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/ai001/800/450",
    upvotes: 2341,
    downvotes: 67,
    votes: 2341,
    comment_count: 387,
    user_voted: 1,
    user_downvoted: false,
    created_at: hoursAgo(3),
    tags: ["Claude", "Anthropic", "代码审查", "Extended Thinking"],
  },
  {
    id: "ai-002",
    title: "Anthropic 发布 Claude 4 Opus：100 万 token 上下文，超长文档一次搞定",
    content: "",
    author: "ai_news_bot",
    author_id: "uid-ainewsbot",
    community: "ai_frontier",
    post_type: "NEWS",
    content_type: "link",
    link_url: "https://www.anthropic.com/news",
    link_meta: {
      title: "Introducing Claude 4 Opus",
      description: "Our most capable model yet, with 1M token context window and breakthrough reasoning abilities.",
      image: "https://picsum.photos/seed/ai002link/1200/630",
      domain: "anthropic.com",
      favicon: "https://www.anthropic.com/favicon.ico",
    },
    upvotes: 1876,
    downvotes: 234,
    votes: 1876,
    comment_count: 445,
    user_voted: 0,
    user_downvoted: false,
    created_at: hoursAgo(18),
    tags: ["Anthropic", "Claude 4", "发布"],
  },
  {
    id: "ai-003",
    title: "本地部署 DeepSeek-R1-32B：RTX 4090 vs M3 Max 速度实测",
    content: "详细测试了两个硬件平台在 DeepSeek-R1-32B 上的推理速度对比，附完整量化配置。",
    author: "local_llm_fan",
    author_id: "uid-llmfan",
    community: "ai_frontier",
    post_type: "HARDWARE",
    content_type: "media",
    media_urls: [
      "https://picsum.photos/seed/ai003a/800/450",
      "https://picsum.photos/seed/ai003b/800/450",
    ],
    upvotes: 3102,
    downvotes: 41,
    votes: 3102,
    comment_count: 521,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(1),
    tags: ["DeepSeek", "本地部署", "GPU", "Apple Silicon"],
  },
  {
    id: "ai-005",
    title: "提示词工程 2025 年最新范式：Chain of Thought 已经过时了？",
    content: "CoT 在 2023 年极大提升了 LLM 推理能力，但随着模型内置思维链（o1/Claude 3.7 的 Extended Thinking），显式 CoT 提示词的边际收益在下降。本文梳理 2025 年值得关注的五种新范式：反事实推理提示、多智能体辩论、树状搜索提示、记忆增强提示和工具链编排。",
    author: "prompt_master",
    author_id: "uid-pm",
    community: "ai_frontier",
    post_type: "OPINION",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/ai005/800/480",
    upvotes: 1423,
    downvotes: 312,
    votes: 1423,
    comment_count: 298,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(3),
    tags: ["Prompt Engineering", "CoT", "LLM"],
  },
];

// ── r/indie_hacker_cn (mock-community-004) ──────────────────
const POSTS_INDIE: MockPost[] = [
  {
    id: "ih-001",
    title: "我的 SaaS 产品上线 3 个月复盘：月收入从 $0 到 $3,200 的完整路径",
    content: "3 个月前我在这里发了第一篇「上线了」的帖子，今天来做个完整复盘。从产品定位失败到找到 PMF，从无人问津到第一个付费用户，再到现在稳定的 $3.2k MRR。不是成功学，只是真实的一手经验。关键转折点：放弃 to C、转向小团队 to B，以及把定价从 $9/月提到 $49/月后转化率反而提升了。",
    author: "indie_zhang",
    author_id: "uid-indiezhang",
    community: "indie_hacker_cn",
    post_type: "MILESTONE",
    content_type: "text",
    cover_url: "https://picsum.photos/seed/ih001/800/450",
    upvotes: 1567,
    downvotes: 12,
    votes: 1567,
    comment_count: 234,
    user_voted: 0,
    user_downvoted: false,
    created_at: hoursAgo(6),
    tags: ["SaaS", "MRR", "增长", "复盘"],
  },
  {
    id: "ih-003",
    title: "Y Combinator 2025 S 批申请通道开放，附上我写的申请文件分享",
    content: "",
    author: "ph_veteran",
    author_id: "uid-phv",
    community: "indie_hacker_cn",
    post_type: "RESOURCE",
    content_type: "link",
    link_url: "https://www.ycombinator.com/apply",
    link_meta: {
      title: "Apply to Y Combinator",
      description: "YC invests $500k in early-stage startups in exchange for 7% equity. Applications for S25 are now open.",
      image: "https://picsum.photos/seed/ih003link/1200/630",
      domain: "ycombinator.com",
    },
    upvotes: 876,
    downvotes: 8,
    votes: 876,
    comment_count: 143,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(2),
    tags: ["YC", "融资", "创业"],
  },
  {
    id: "ih-004",
    title: "我的产品发布日 App Store 截图 & 官网设计全部开源",
    content: "Product Hunt 发布后很多人问我截图和官网怎么做的，干脆全部开源，包含 Figma 源文件。",
    author: "liming_dev",
    author_id: "uid-liming",
    community: "indie_hacker_cn",
    post_type: "RESOURCE",
    content_type: "media",
    media_urls: [
      "https://picsum.photos/seed/ih004a/800/460",
      "https://picsum.photos/seed/ih004b/800/460",
      "https://picsum.photos/seed/ih004c/800/460",
    ],
    upvotes: 1234,
    downvotes: 15,
    votes: 1234,
    comment_count: 167,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(3),
    tags: ["设计", "开源", "Figma", "Product Hunt"],
  },
  {
    id: "ih-005",
    title: "冷启动获客：我是如何在零预算下拿到前 1000 个用户的",
    content: "零付费推广，纯靠内容分发和社群运营，3 个月拿到 1000 个真实用户。具体渠道占比：Reddit 占 42%、Twitter/X 占 28%、掘金 + 少数派占 18%、口碑传播 12%。每个渠道的具体打法和踩过的坑全部写在这里。",
    author: "growth_hacker_cn",
    author_id: "uid-growth",
    community: "indie_hacker_cn",
    post_type: "GROWTH",
    content_type: "text",
    upvotes: 1892,
    downvotes: 22,
    votes: 1892,
    comment_count: 321,
    user_voted: 0,
    user_downvoted: false,
    created_at: daysAgo(5),
    tags: ["冷启动", "增长", "SEO", "社群运营"],
  },
];

// ── 主映射表 ─────────────────────────────────────────────────
export const COMMUNITY_POSTS: Record<string, MockPost[]> = {
  "mock-community-001": POSTS_NEXTJS,
  "mock-community-002": POSTS_UI_DESIGN,
  "mock-community-003": POSTS_AI,
  "mock-community-004": POSTS_INDIE,
};

// 所有社区帖文合并（用于主页）
export const ALL_MOCK_POSTS: MockPost[] = [
  ...POSTS_NEXTJS,
  ...POSTS_UI_DESIGN,
  ...POSTS_AI,
  ...POSTS_INDIE,
];