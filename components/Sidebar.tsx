"use client";

import { useRef, useEffect, useState } from "react";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "./AuthProvider";
import { translations, Lang } from "@/lib/translations";
import Link from "next/link";
import { usePathname } from "next/navigation";

function AccordionItem({
  icon,
  label,
  open,
  onToggle,
  children,
  theme,
}: {
  icon: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: "light" | "dark";
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  return (
    <div className="border-b" style={{ borderColor: theme === "dark" ? "#44403c" : "#e5e7eb" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition"
        style={{ color: theme === "dark" ? "#e7e5e4" : "#374151" }}
      >
        <span>
          {icon} {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? `${height}px` : "0" }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, lang, setLang, profile, saveProfile } = useApp();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const t = (key: string) => translations[lang][key] || key;
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [openProfile, setOpenProfile] = useState(false);
  const [openAppearance, setOpenAppearance] = useState(false);
  const [openLanguage, setOpenLanguage] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setSidebarOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  const themeClasses =
    theme === "dark"
      ? "bg-[#292524] text-[#e7e5e4] border-r border-[#44403c]"
      : "bg-white text-gray-900 border-r border-gray-200";

  const itemHover = theme === "dark" ? "hover:bg-[#44403c]" : "hover:bg-gray-100";

  const inputStyle = {
    backgroundColor: theme === "dark" ? "#44403c" : "#fff",
    borderColor: theme === "dark" ? "#57534e" : "#d1d5db",
    color: theme === "dark" ? "#e7e5e4" : "#111827",
  };

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl ${themeClasses} ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme === "dark" ? "#44403c" : "#e5e7eb" }}>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md transition"
            style={{ color: theme === "dark" ? "#e7e5e4" : "#374151" }}
            title={t("back")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-lg">{t("settings")}</span>
          <div className="w-10" />
        </div>

        {/* ── Accordion: Profile ── */}
        <AccordionItem icon="👤" label={t("profile")} open={openProfile} onToggle={() => setOpenProfile(!openProfile)} theme={theme}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
              {profile.photoBase64 ? (
                <img src={profile.photoBase64} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                  {(profile.name || user?.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user?.name || t("profile")}</p>
              <p className="text-sm truncate" style={{ color: theme === "dark" ? "#a8a29e" : "#6b7280" }}>
                @{user?.username}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder={t("full_name")}
              value={profile.name}
              onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => saveProfile({ ...profile, birthDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder={t("phone") || "Telp"}
                value={profile.phone}
                onChange={(e) => saveProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              />
            </div>
            <textarea
              placeholder={t("address") || "Alamat"}
              value={profile.address}
              onChange={(e) => saveProfile({ ...profile, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={inputStyle}
            />
            <label className="block">
              <span className="text-xs font-medium" style={{ color: theme === "dark" ? "#a8a29e" : "#6b7280" }}>
                {t("photo")}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      saveProfile({ ...profile, photoBase64: ev.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="mt-1 w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </label>
          </div>
        </AccordionItem>

        {/* ── Accordion: Appearance ── */}
        <AccordionItem icon="🎨" label={t("appearance")} open={openAppearance} onToggle={() => setOpenAppearance(!openAppearance)} theme={theme}>
          <div className="flex items-center justify-between">
            <span className="text-sm">{theme === "dark" ? t("dark_mode") : t("light_mode")}</span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                theme === "dark" ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </AccordionItem>

        {/* ── Accordion: Language ── */}
        <AccordionItem icon="🌐" label={t("language")} open={openLanguage} onToggle={() => setOpenLanguage(!openLanguage)} theme={theme}>
          <div className="flex flex-col space-y-2">
            {(["id", "en", "jp"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition text-left ${
                  lang === l
                    ? "bg-indigo-600 text-white"
                    : ""
                }`}
                style={
                  lang === l
                    ? {}
                    : {
                        backgroundColor: theme === "dark" ? "#44403c" : "#f3f4f6",
                        color: theme === "dark" ? "#e7e5e4" : "#374151",
                      }
                }
              >
                {l === "id" ? "🇮🇩 Indonesia" : l === "en" ? "🇬🇧 English" : "🇯🇵 日本語"}
              </button>
            ))}
          </div>
        </AccordionItem>

        {/* ── Navigation links ── */}
        <div className="p-4 space-y-1">
          {user?.role === "admin" && (
            <>
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${itemHover} ${
                  pathname === "/admin" ? "bg-indigo-100 text-indigo-700" : ""
                }`}
              >
                📊 {t("admin_dashboard")}
              </Link>
              <Link
                href="/admin/members"
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${itemHover} ${
                  pathname === "/admin/members" ? "bg-indigo-100 text-indigo-700" : ""
                }`}
              >
                👥 {t("manage_members")}
              </Link>
            </>
          )}
          {(!user || user?.role === "member") && (
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${itemHover} ${
                pathname === "/dashboard" ? "bg-indigo-100 text-indigo-700" : ""
              }`}
            >
              📋 {t("dashboard")}
            </Link>
          )}
          {user && (
            <button
              onClick={() => { logout(); setSidebarOpen(false); }}
              className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${itemHover} text-red-600`}
            >
              🚪 {t("logout")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
