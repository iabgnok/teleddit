"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Mail, Lock } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  // 处理登录
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 改为发送 JSON 数据，路径改为 /auth/login，传递 email 字段
      const data = await fetchApi<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      localStorage.setItem("access_token", data.access_token);
      await refreshUser(); // 更新全局 AuthContext 状态
      router.push("/");
    } catch (err: any) {
      setError(err.message || "登录失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleSignUp = async () => {
    if (!email || !password) {
      setError("请先填写邮箱和密码");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const defaultUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          username: defaultUsername,
          password
        }),
        requireAuth: false,
      });

      alert("注册成功！请直接登录。");
    } catch (err: any) {
      setError(err.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e3a8a_0%,transparent_50%)] opacity-20" />
      <div className="absolute w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      
      <div className="w-full max-w-md z-10">
        <div className="bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase">Teleddit</h1>
            <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-widest italic">Authorized Access Only</p>
          </div>

          <form onSubmit={handleSignIn} className="community-y-6">
            <div className="community-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Credentials</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl animate-pulse">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                LOG IN
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full bg-transparent hover:bg-white/5 text-slate-400 font-bold py-3 rounded-2xl transition-all text-xs uppercase tracking-widest"
              >
                Register Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
