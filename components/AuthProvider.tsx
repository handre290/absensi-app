"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser, logout as authLogout } from "@/lib/auth";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loginUser: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const loginUser = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const logout = () => {
    authLogout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
