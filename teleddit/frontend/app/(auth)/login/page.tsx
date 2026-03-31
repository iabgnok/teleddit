"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      return handleSignUp();
    }
    
    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      localStorage.setItem("access_token", data.access_token);
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed, please check credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      setError("Please fill in email, username and password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          username,
          password
        }),
        requireAuth: false,
      });

      alert("Registration successful! Please login.");
      setIsRegisterMode(false);
    } catch (err: any) {
      setError(err.message || "Registration failed");
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

          <form onSubmit={handleSignIn} className="space-y-6 flex flex-col gap-6">
            <div className="space-y-2 flex flex-col gap-2">
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

              {isRegisterMode && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-white placeholder:text-slate-600"
                    required={isRegisterMode}
                  />
                </div>
              )}

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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 uppercase"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                {isRegisterMode ? "REGISTER" : "LOG IN"}
              </button>

              <button
                type="button"
                onClick={() => {
                   setIsRegisterMode(!isRegisterMode);
                   setError(null);
                }}
                disabled={loading}
                className="w-full bg-transparent hover:bg-white/5 text-slate-400 font-bold py-3 rounded-2xl transition-all text-xs uppercase tracking-widest"
              >
                {isRegisterMode ? "Back to Login" : "Register Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
