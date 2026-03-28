"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 关键：解决遮挡问题
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, BellOff, Phone, MoreHorizontal, 
  Users, Ban, X, Search, LogOut 
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  info?: string;
  type: 'user' | 'group';
}

interface UserAvatarProps {
  data: ProfileData;
  size?: number;
}

export const UserAvatar = ({ data, size = 20 }: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 确保 Portal 仅在客户端挂载
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // 弹窗主体内容
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
          {/* 背景遮罩 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 弹窗主体：使用 Portal 后将完美居中且不被遮挡 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[360px] bg-white rounded-[24px] overflow-hidden shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full z-20 transition-colors"
            >
              <X size={20} />
            </button>

            {/* 顶部预览区域 */}
            <div className="pt-10 pb-6 px-6 flex flex-col items-center border-b border-slate-50 bg-slate-50/50">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md ${
                data.type === 'group' ? 'bg-gradient-to-tr from-[#6ab3f3] to-[#5288c1]' : 'bg-orange-400'
              }`}>
                {data.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
              <span className="text-sm text-slate-400 mt-1">{data.status || "在线"}</span>
            </div>

            {/* 操作按钮区 */}
            <div className="flex justify-around p-4 border-b border-slate-50">
              <ActionBtn icon={<MessageCircle size={20} />} label={data.type === 'group' ? "发送消息" : "私聊"} />
              <ActionBtn icon={<BellOff size={20} />} label="静音" />
              {data.type === 'user' ? (
                <ActionBtn icon={<Phone size={20} />} label="通话" />
              ) : (
                <ActionBtn icon={<Search size={20} />} label="搜索" />
              )}
              <ActionBtn icon={<MoreHorizontal size={20} />} label="更多" />
            </div>

            {/* 信息详情区 - 补全之前的显示逻辑 [cite: 107, 108, 109] */}
            <div className="py-2 max-h-[45vh] overflow-y-auto custom-scrollbar">
              {data.type === 'user' ? (
                <>
                  <InfoItem title={data.info || "+86 123 **** 8888"} subtitle="手机号" color="text-blue-500" />
                  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 text-blue-500 font-medium transition-colors">
                    添加为联系人
                  </button>
                  <Divider />
                  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 text-slate-700 transition-colors">
                    <Users size={20} className="text-slate-400"/> 1 个共同群组
                  </button>
                  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-50 text-red-500 transition-colors">
                    <Ban size={20}/> 屏蔽该用户
                  </button>
                </>
              ) : (
                <>
                  <InfoItem title={data.info || "这是一个绳网核心讨论小组。"} subtitle="描述" />
                  <InfoItem title="t.me/sn_core_group" subtitle="邀请链接" color="text-blue-500" />
                  <Divider />
                  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 text-slate-700 transition-colors">
                    <Users size={20} className="text-slate-400"/> 查看 1,024 位成员
                  </button>
                  <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-50 text-red-500 transition-colors">
                    <LogOut size={20}/> 退出群组
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div 
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="relative cursor-pointer hover:opacity-90 shrink-0"
        style={{ width: size, height: size }}
      >
        <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold border border-white/10 ${
          data.type === 'group' ? 'bg-gradient-to-tr from-[#6ab3f3] to-[#5288c1]' : 'bg-orange-400'
        }`}>
          {data.name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* 将弹窗渲染到 body 根部，彻底避开消息气泡层级 [cite: 69, 72] */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
};

// --- 辅助子组件 [cite: 110, 111, 112] ---

const ActionBtn = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="flex flex-col items-center gap-1 group w-16">
    <div className="w-12 h-12 flex items-center justify-center text-slate-600 bg-slate-50 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
      {icon}
    </div>
    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
  </button>
);

const InfoItem = ({ title, subtitle, color = "text-slate-900" }: { title: string, subtitle: string, color?: string }) => (
  <div className="px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
    <div className={`text-[15px] ${color} break-all`}>{title}</div>
    <div className="text-[13px] text-slate-400">{subtitle}</div>
  </div>
);

const Divider = () => <div className="h-[6px] bg-slate-50 my-1" />;