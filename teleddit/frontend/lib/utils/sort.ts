import { Sparkles, Flame, Clock, BarChart2, TrendingUp } from "lucide-react";

export const SORT_OPTIONS = [
  { key: "best",   label: "Best",   Icon: Sparkles,   color: "text-blue-400",   desc: "最佳" },
  { key: "hot",    label: "Hot",    Icon: Flame,      color: "text-orange-400", desc: "热门" },
  { key: "new",    label: "New",    Icon: Clock,      color: "text-green-400",  desc: "最新" },
  { key: "top",    label: "Top",    Icon: BarChart2,  color: "text-purple-400", desc: "最高赞" },
  { key: "rising", label: "Rising", Icon: TrendingUp, color: "text-yellow-400", desc: "上升中" },
] as const;

export type SortKey = typeof SORT_OPTIONS[number]["key"];

export function sortPosts(posts: any[], sort: SortKey) {
  return [...posts].sort((a, b) => {
    if (sort === "new")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "top")
      return (b.upvotes ?? b.votes ?? 0) - (a.upvotes ?? a.votes ?? 0);
    if (sort === "hot" || sort === "best") {
      const s = (p: any) => {
        const up = p.upvotes ?? p.votes ?? 0;
        const down = p.downvotes ?? 0;
        return (up + 1) / (up + down + 2);
      };
      return s(b) - s(a);
    }
    if (sort === "rising") {
      const age = (p: any) => (Date.now() - new Date(p.created_at).getTime()) / 3600000;
      const up = (p: any) => p.upvotes ?? p.votes ?? 0;
      return up(b) / (age(b) + 1) - up(a) / (age(a) + 1);
    }
    return 0;
  });
}
