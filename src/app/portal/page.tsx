"use client";

import { useActionState } from "react";
import { resolveChurchPortalAction } from "@/app/actions/auth";

export default function PortalGatePage() {
  const [state, formAction, isPending] = useActionState(resolveChurchPortalAction, null);

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-orange/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <a href="/" className="w-14 h-14 bg-zinc-900 border border-brand-orange/30 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/10 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
            <span className="text-brand-orange font-extrabold text-2xl tracking-tighter block transform rotate-6 hover:rotate-0 transition-transform">
              ✝
            </span>
          </a>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Portal Gateway
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400 font-medium">
          Masuk ke Dashboard Admin Yesh CMS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-zinc-900/80 backdrop-blur-md py-8 px-6 border border-white/10 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" action={formAction}>
            
            {state?.error && (
              <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 text-brand-gold text-xs rounded-lg font-semibold leading-relaxed">
                ⚠️ {state.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Email Terdaftar Admin / Staf
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all placeholder-zinc-600"
                placeholder="admin@gereja.com"
              />
              <p className="mt-2 text-[10px] text-zinc-500 font-medium">
                Sistem akan mendeteksi portal gereja Anda secara otomatis berdasarkan email yang dimasukkan.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-orange to-brand-gold text-zinc-950 font-black text-xs uppercase tracking-widest rounded-md hover:from-brand-orange hover:to-brand-orange-light shadow-lg shadow-brand-orange/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memverifikasi...
                </>
              ) : (
                "Cari Portal Saya →"
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <a href="/" className="hover:text-brand-orange transition-colors">← Kembali ke Utama</a>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-600 select-none">Yesh CMS Portal Gateway</span>
        </div>
      </div>
    </div>
  );
}
