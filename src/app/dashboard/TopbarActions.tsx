"use client";
import { logoutAction } from "@/app/actions/auth";

export default function TopbarActions() {
  return (
    <div className="flex items-center gap-5">
      <button className="text-zinc-400 hover:text-zinc-900 transition-colors relative p-1" title="Notifikasi">
        <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      </button>
      
      <div className="h-5 w-px bg-zinc-200"></div>

      <form action={logoutAction}>
        <button type="submit" className="text-sm font-semibold text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </form>
    </div>
  );
}
