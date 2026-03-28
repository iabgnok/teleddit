import type { Metadata } from "next";
import "./globals.css";
import "./tiptap.css"
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Teleddit - AI 驱动的内容社区",
  description: "AI 赋能的未来论坛平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="dark">
      <body className="antialiased bg-[#0f0f0f] text-slate-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}