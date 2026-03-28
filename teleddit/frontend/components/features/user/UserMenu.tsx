"use client";

import { useState } from "react";
import { User, Settings, LogOut, Shield, Moon, Award, PieChart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserMenu({ userEmail }: { userEmail: string }) {        
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    router.push("/login")
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 触发器：原来的蓝色色块 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform border border-white/10"
      />

      {/* 下拉菜单内容 */}
      {isOpen && (
        <>
          {/* 点击外部关闭的透明遮罩 */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-64 bg-[#1b1b1b] border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
            {/* 用户信息头部 */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                  {userEmail[0]?.toUpperCase() || "U"}
               </div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-slate-400">View Profile</span>  
                  <span className="text-sm font-bold truncate text-slate-200">u/{userEmail.split('@')[0]}</span>
               </div>
            </div>

            {/* 功能列表 */}
            <div className="py-2">
              <MenuLink icon={<Award className="w-4 h-4" />} label="Achievements" extra="7 unlocked" />
              <MenuLink icon={<PieChart className="w-4 h-4" />} label="Contributor Program" />
              <MenuLink icon={<Shield className="w-4 h-4" />} label="Premium" />
            </div>

            <div className="py-2 border-t border-white/5">
              <MenuLink icon={<Moon className="w-4 h-4" />} label="Display Mode" />
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>

            <div className="py-2 border-t border-white/5">
              <MenuLink icon={<Settings className="w-4 h-4" />} label="Settings" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 辅助子组件：菜单项样式
function MenuLink({ icon, label, extra }: { icon: React.ReactNode, label: string, extra?: string }) {
  return (
    <button className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center justify-between transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</span>
        {label}
      </div>
      {extra && <span className="text-[10px] text-slate-500">{extra}</span>}    
    </button>
  );
}