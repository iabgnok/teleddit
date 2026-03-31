"use client";

import { useState } from "react";
import { User, Settings, LogOut, Shield, Moon, Award, PieChart, X, Loader2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchApi } from "@/lib/api/client";

export default function UserMenu({ userEmail }: { userEmail: string }) {        
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, refreshUser, logout } = useAuth();

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleLogout = () => { logout(); setIsOpen(false); };
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
  };

  const openSettings = () => {
    setNewUsername(user?.username || "");
    setNewPassword("");
    setSuccess(false);
    setError(null);
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const body: any = {};
      if (newUsername.trim() && newUsername !== user?.username) body.username = newUsername.trim();
      if (newPassword.trim()) body.password = newPassword;

      if (Object.keys(body).length === 0) {
        setError("Note: No changes made");
        setLoading(false);
        return;
      }

      await fetchApi("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      await refreshUser();
      setSuccess(true);
      if (body.password) {
         setNewPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const displayUsername = user?.username || userEmail.split('@')[0];

  return (
    <>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner"
        >
          {displayUsername[0]?.toUpperCase() || "U"}
        </div>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => { setIsOpen(false); setIsSettingsOpen(false); }} />
            <div className="absolute right-0 mt-3 w-64 bg-[#1b1b1b] border border-white/10 rounded-2xl shadow-2xl z-[9999] py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-white/10 mb-2">
                <p className="text-sm font-semibold text-white truncate">{displayUsername}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
              </div>

              <div className="px-2 mb-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <User size={16} className="text-slate-400" /> Profile
                </button>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={16} className="text-slate-400" /> Settings
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
              </div>

              <div className="px-2 pt-2 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>

              {/* Secondary Menu (Settings) */}
              {isSettingsOpen && (
                <div className="absolute top-0 right-[100%] mr-2 w-72 bg-[#1b1b1b] border border-white/10 rounded-2xl shadow-2xl z-[10000] p-4 animate-in slide-in-from-right-2 duration-200">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white">Settings</h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateSettings} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Change Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep same"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>

                    {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
                    {success && <div className="text-emerald-500 text-xs mt-1">Updated successfully.</div>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 mt-1 rounded-lg transition-all flex items-center justify-center"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </>
  );
}