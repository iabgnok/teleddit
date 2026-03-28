// app/(main)/layout.tsx
import { MediaViewerProvider } from "@/components/common/media/MediaViewerContext";     

export default async function MainLayout({ children }: { children: React.ReactNode }) {                                                                           
  return (
    <MediaViewerProvider>
      {/* 仅保留最外层全屏容器，不作任何分栏，分栏交给 page 处理 */}
      <div className="flex h-screen w-full overflow-hidden bg-black">
        {children}
      </div>
    </MediaViewerProvider>
  );
}