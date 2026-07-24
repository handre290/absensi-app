"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang } from "./translations";

// ── Types ──

export interface ProfileData {
  name: string;
  username: string;
  photoBase64: string;
  birthDate: string;
  phone: string;
  address: string;
}

const defaultProfile: ProfileData = {
  name: "",
  username: "",
  photoBase64: "",
  birthDate: "",
  phone: "",
  address: "",
};

interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  profile: ProfileData;
  saveProfile: (p: ProfileData) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLangState] = useState<Lang>("id");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load saved state
  useEffect(() => {
    const savedTheme = localStorage.getItem("absensi_theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    const savedLang = localStorage.getItem("absensi_lang");
    if (savedLang === "en" || savedLang === "jp" || savedLang === "id") setLangState(savedLang);
    const savedProfile = localStorage.getItem("absensi_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch {}
    }
  }, []);

  // Sync theme to <html> class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("absensi_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("absensi_lang", l);
  };

  const saveProfile = (p: ProfileData) => {
    setProfile(p);
    localStorage.setItem("absensi_profile", JSON.stringify(p));
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, setLang, profile, saveProfile, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
