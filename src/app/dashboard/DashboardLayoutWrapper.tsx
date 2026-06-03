"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarNav from "./SidebarNav";
import TopbarActions from "./TopbarActions";

export default function DashboardLayoutWrapper({
  children,
  user,
  pendingProgramsCount = 0,
  pendingPrograms = [],
}: {
  children: React.ReactNode;
  user: any;
  pendingProgramsCount?: number;
  pendingPrograms?: any[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("dashboard-theme") || "dark";
    const dark = savedTheme === "dark";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dashboard-dark");
    } else {
      document.documentElement.classList.remove("dashboard-dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("dashboard-theme", nextDark ? "dark" : "light");
    if (nextDark) {
      document.documentElement.classList.add("dashboard-dark");
    } else {
      document.documentElement.classList.remove("dashboard-dark");
    }
  };

  // Check feature limitations set by Super Admin
  let isForbidden = false;
  const allowedMenus = user.church.allowedMenus;
  if (allowedMenus && Array.isArray(allowedMenus)) {
    const pathMenuMapping: { [key: string]: string } = {
      "/dashboard/approval": "Program Gereja",
      "/dashboard/persuratan": "Persuratan",
      "/dashboard/keuangan": "Keuangan & Donasi",
      "/dashboard/inventaris": "Inventaris",
      "/dashboard/jemaat": "Jemaat",
      "/dashboard/kehadiran": "Ibadah",
      "/dashboard/pelayanan": "Pelayanan",
      "/dashboard/sakramen": "Sakramen",
      "/dashboard/visitasi": "Visitasi",
      "/dashboard/komsel": "Komsel",
      "/dashboard/program": "Program",
      "/dashboard/full-timer": "Full timer",
      "/dashboard/hamba-tuhan": "Hamba Tuhan",
    };

    const matchedPath = Object.keys(pathMenuMapping).find(path => pathname.startsWith(path));
    if (matchedPath) {
      const requiredMenu = pathMenuMapping[matchedPath];
      if (!allowedMenus.includes(requiredMenu)) {
        isForbidden = true;
      }
    }
  }

  return (
    <div className="flex h-screen bg-dashboard-wrapper bg-[#f4f4f5] overflow-hidden font-sans text-zinc-900 selection:bg-purple-200">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sleek Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 shrink-0 justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
            ✝ Yesh<span className="text-amber-500">CMS</span>
          </Link>
          <button className="md:hidden text-zinc-500 hover:text-zinc-900" onClick={() => setSidebarOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div onClick={() => setSidebarOpen(false)}>
            <SidebarNav 
              role={user.role} 
              rolePermissions={user.church.rolePermissions || {}} 
              customPermissions={user.customPermissions}
              pendingProgramsCount={pendingProgramsCount}
              allowedMenus={user.church.allowedMenus}
            />
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-zinc-100 shrink-0 bg-zinc-50/50 m-2 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold truncate text-zinc-900">{user.name}</div>
              <div className="text-xs text-zinc-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Sleek Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full">
              <span className="text-zinc-500 font-medium hidden sm:inline">Gereja:</span>
              <span>{user.church.name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 bg-white/50 hover:bg-zinc-100 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              title={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {isDark ? (
                /* Sun Icon */
                <svg className="w-4 h-4 text-amber-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                /* Moon Icon */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
             <TopbarActions 
               pendingPrograms={pendingPrograms} 
               pendingProgramsCount={pendingProgramsCount} 
             />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            {isForbidden ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-zinc-200/80 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-amber-100 rounded-full blur-[80px] pointer-events-none opacity-40" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-indigo-100 rounded-full blur-[80px] pointer-events-none opacity-40" />

                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/50 flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-3">Fitur Terkunci</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    Fitur ini dinonaktifkan atau dibatasi oleh Super Admin untuk akun gereja Anda. Silakan hubungi Super Admin untuk memperbarui lisensi atau limitasi akun Anda.
                  </p>
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
