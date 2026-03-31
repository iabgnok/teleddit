"use client";

import { useState, useEffect, useRef } from "react";
import { X, ShieldAlert, Users, Settings, UserMinus, Loader2, Check, XCircle, Upload } from "lucide-react";
import { communityApi, type JoinRequest } from "@/lib/api/community";
import { uploadFile } from "@/lib/api/client";
import type { CommunityItem } from "@/types/community";

interface Props {
  community: CommunityItem;
  onClose: () => void;
  onUpdated: () => void;
}

export function CommunityManageModal({ community, onClose, onUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<"settings" | "requests" | "bans">("settings");
  
  // Settings state
  const [formData, setFormData] = useState({
    name: community.name || "",
    avatarUrl: community.avatarUrl || "",
    description: community.description || "",
    visibility: community.visibility || "public",
    joinMode: community.joinMode || "open",
    postPermission: community.postPermission || "everyone",
    commentPermission: community.commentPermission || "everyone",
  });
  const [saving, setSaving] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Requests state
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab]);

  const loadRequests = async () => {
    setLoadingReqs(true);
    try {
      const data = await communityApi.getJoinRequests(community.id);
      setRequests(data);
    } catch (e: any) {
      alert("加载申请失败：" + e.message);
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await communityApi.updateAdminSettings(community.id, formData);
      alert("设置已更新！");
      onUpdated();
    } catch (e: any) {
      alert("更新失败: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingAvatar(true);
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file);
      setFormData(prev => ({ ...prev, avatarUrl: res.url }));
    } catch (err: any) {
      alert("上传失败: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleApprove = async (reqId: number) => {
    try {
      await communityApi.approveJoinRequest(community.id, reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e: any) {
      alert("操作失败: " + e.message);
    }
  };

  const handleReject = async (reqId: number) => {
    try {
      await communityApi.rejectJoinRequest(community.id, reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e: any) {
      alert("操作失败: " + e.message);
    }
  };

  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const handleBan = async () => {
    if (!banUserId.trim()) return;
    try {
      await communityApi.banUser(community.id, banUserId.trim(), banReason.trim());
      alert("封禁成功");
      setBanUserId("");
      setBanReason("");
    } catch (e: any) {
      alert("封禁失败: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl shadow-black">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#222]">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldAlert size={20} className="text-blue-500" />
            社区管理: {community.name}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-[#1e1e1e] border-r border-white/5 flex flex-col py-2">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "settings" ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"
              }`}
            >
              <Settings size={18} /> 基础设置
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "requests" ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"
              }`}
            >
              <Users size={18} /> 入群申请
            </button>
            <button
              onClick={() => setActiveTab("bans")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "bans" ? "text-red-400 bg-red-500/10 border-l-2 border-red-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"
              }`}
            >
              <UserMinus size={18} /> 封禁管理
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#161616] custom-scrollbar">
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-slate-300 text-sm font-bold mb-2">社区名称</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-bold mb-2">社区头像链接 (Avatar URL)</label>
                  <div className="flex gap-2">
                    <input
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.png"
                      className="flex-1 w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 shrink-0 min-w-[90px]"
                    >
                      {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploadingAvatar ? "上传中" : "上传"}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-bold mb-2">社区简介</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">可见性 (Visibility)</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                      className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="public">公开 (所有人可见)</option>
                      <option value="restricted">受限 (内容公开，需加入才能互动)</option>
                      <option value="private">私密 (仅成员可见)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">加群方式 (Join Mode)</label>
                    <select
                      value={formData.joinMode}
                      onChange={(e) => setFormData({ ...formData, joinMode: e.target.value as any })}
                      className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="open">自由加入</option>
                      <option value="apply">需审批</option>
                      <option value="invite_only">仅邀请</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">发帖权限</label>
                    <select
                      value={formData.postPermission}
                      onChange={(e) => setFormData({ ...formData, postPermission: e.target.value as any })}
                      className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="everyone">所有人</option>
                      <option value="members_only">仅成员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">评论权限</label>
                    <select
                      value={formData.commentPermission}
                      onChange={(e) => setFormData({ ...formData, commentPermission: e.target.value as any })}
                      className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="everyone">所有人</option>
                      <option value="members_only">仅成员</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving ? "保存中..." : "保存设置"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-white font-bold mb-4">待处理的入群申请</h3>
                {loadingReqs ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={30} className="animate-spin text-blue-500" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-slate-500 text-center py-10">暂无待处理的申请</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div key={req.id} className="bg-[#222] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-slate-200 font-bold mb-1">User ID: <span className="font-mono text-xs">{req.userId}</span></div>
                          <div className="text-slate-400 text-sm">留言: {req.message || "无"}</div>
                          <div className="text-slate-500 text-xs mt-1">{new Date(req.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(req.id)} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg" title="同意">
                            <Check size={18} />
                          </button>
                          <button onClick={() => handleReject(req.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg" title="拒绝">
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "bans" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-white font-bold mb-4 text-red-400">封禁新用户</h3>
                <div className="space-y-4 bg-[#222] p-5 rounded-xl border border-red-500/20">
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">User ID (要封禁的用户ID)</label>
                    <input
                      value={banUserId}
                      onChange={(e) => setBanUserId(e.target.value)}
                      placeholder="填入用户的 UUID..."
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2">封禁原因 (可选)</label>
                    <input
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="例如：违规发帖"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    onClick={handleBan}
                    disabled={!banUserId.trim()}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-colors"
                  >
                    确认封禁该用户
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}