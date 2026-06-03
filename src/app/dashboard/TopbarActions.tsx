"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

interface PendingProgram {
  id: string;
  nama: string;
  divisi: string;
  penanggungJawab: string;
  createdAt: string;
}

interface TopbarActionsProps {
  pendingPrograms?: PendingProgram[];
  pendingProgramsCount?: number;
}

export default function TopbarActions({
  pendingPrograms = [],
  pendingProgramsCount = 0,
}: TopbarActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-5 relative">
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-400 hover:text-zinc-900 dark-text-hover transition-colors relative p-1 cursor-pointer"
          title="Notifikasi"
        >
          {pendingProgramsCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-brand-orange text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse border border-white dark-border">
              {pendingProgramsCount}
            </span>
          ) : (
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark-border"></span>
          )}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Dropdown Overlay for Outside Clicks */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            
            {/* Notifications Dropdown Panel */}
            <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl py-4 z-40 text-left animate-fade-in-up">
              <div className="px-4 pb-2 border-b border-zinc-100 flex justify-between items-center">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Notifikasi</span>
                {pendingProgramsCount > 0 && (
                  <span className="bg-brand-orange/20 text-brand-orange text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                    {pendingProgramsCount} Tertunda
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto mt-2">
                {pendingPrograms.length === 0 ? (
                  <div className="py-8 px-4 text-center text-zinc-400 text-xs font-semibold">
                    🎉 Tidak ada notifikasi baru
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {pendingPrograms.map((prog) => (
                      <Link
                        key={prog.id}
                        href="/dashboard/approval"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="text-xs font-bold text-zinc-900 leading-normal">
                          Program Baru: <span className="text-zinc-700 font-medium">{prog.nama}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-semibold mt-1 flex justify-between items-center">
                          <span>Divisi: <span className="font-bold">{prog.divisi}</span></span>
                          <span>{new Date(prog.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {pendingProgramsCount > 0 && (
                <div className="px-4 pt-3 border-t border-zinc-100 text-center">
                  <Link
                    href="/dashboard/approval"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-black text-brand-orange hover:text-brand-orange-light tracking-wider uppercase"
                  >
                    Lihat Semua Program &rarr;
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="h-5 w-px bg-zinc-200 dark-border"></div>

      {/* Logout Action */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm font-semibold text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </form>
    </div>
  );
}
