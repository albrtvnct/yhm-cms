"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:px-20 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          
          <div className="text-left mb-10">
            <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight text-zinc-900 mb-8 lg:hidden">
              ✝ Yesh<span className="text-amber-500">CMS</span>
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">Daftarkan Gereja</h1>
            <p className="text-zinc-500">
              Mulai kelola gereja Anda secara digital dalam hitungan menit.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700" htmlFor="churchName">Nama Gereja</label>
              <input 
                type="text" 
                id="churchName"
                name="churchName"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                placeholder="Contoh: GBI Kasih Karunia" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700" htmlFor="adminName">Nama Admin Utama</label>
              <input 
                type="text" 
                id="adminName"
                name="adminName"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                placeholder="Nama lengkap Anda" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="phone">Nomor HP</label>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="0812xxxx" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="email">E-Mail</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="admin@gereja.com" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="Min. 8 karakter" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="confirmPassword">Konfirmasi</label>
                <input 
                  type="password" 
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="Ulangi password" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-[#09090b] hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2 flex justify-center items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyiapkan...
                </>
              ) : "Buat Akun Gereja"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Sudah mendaftar?{" "}
            <Link href="/login" className="font-semibold text-zinc-900 hover:text-purple-600 transition-colors">
              Masuk ke Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Right Pane - Branding & Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#09090b] text-white p-12 flex-col justify-between overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-900/30 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 flex justify-end">
          <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight">
            ✝ Yesh<span className="text-amber-400">CMS</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl max-w-md ml-auto">
            <svg className="w-8 h-8 text-amber-400 mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.714-4.062-9.886-9.75-9.815V2c6.516.073 11.75 4.966 11.75 11.609V21h-2zm-9.767 0v-7.391c0-5.714-4.062-9.886-9.75-9.815V2c6.516.073 11.75 4.966 11.75 11.609V21h-2z" /></svg>
            <p className="text-xl font-medium leading-relaxed mb-6">
              "Yesh CMS sangat mempermudah administrasi gereja kami. Mulai dari penjadwalan ibadah hingga rekap keuangan mingguan, semuanya otomatis dan transparan."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-sm">
                PD
              </div>
              <div>
                <div className="font-semibold text-white">Pdt. David</div>
                <div className="text-sm text-zinc-400">Gembala Sidang, GBI Kasih</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
