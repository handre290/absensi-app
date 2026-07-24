"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { translations } from "@/lib/translations";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, lang, theme } = useApp();
  const pathname = usePathname();
  const t = (key: string) => translations[lang][key] || key;

  const navBg = theme === "dark" ? "bg-[#292524]" : "bg-white";
  const navBorder = theme === "dark" ? "border-[#44403c]" : "border-gray-200";
  const textColor = theme === "dark" ? "text-[#e7e5e4]" : "text-gray-900";
  const subText = theme === "dark" ? "text-[#a8a29e]" : "text-gray-500";

  return (
    <nav className={`${navBg} ${navBorder} border-b shadow-sm`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md transition"
              style={{ color: theme === "dark" ? "#e7e5e4" : "#374151" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <span className={`text-xl font-semibold ${textColor}`}>{t("app_name")}</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className={`text-sm ${subText}`}>
                  {user.name}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className={`text-sm font-medium ${
                    pathname === "/login"
                      ? "text-indigo-600"
                      : `${subText} hover:text-gray-700`
                  } transition`}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
