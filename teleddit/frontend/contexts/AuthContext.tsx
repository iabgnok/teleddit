"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";



interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await fetchApi<User>("/auth/me");
      setUser(userData);
    } catch (err: any) {
      console.error("Failed to fetch user context", err);
      // Optional: Clear token if 401 Unauthorized
      if (err.message && err.message.includes("401")) {
         localStorage.removeItem("access_token");
         setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("access_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/login"); // 登出并返回登录页
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
