"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Pane - Branding & Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#09090b] text-white p-12 flex-col justify-between overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight">
            ✝ Yesh<span className="text-amber-400">CMS</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Manajemen Gereja<br />Lebih Cerdas & Terintegrasi
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Kelola data jemaat, lacak keuangan, dan jadwalkan pelayanan dengan sistem yang dirancang khusus untuk memenuhi kebutuhan gereja modern.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#09090b] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <span className="text-xs text-zinc-500">G{i}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400">
              Dipercaya oleh <strong className="text-white">500+</strong> gereja.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">
              ✝ Yesh<span className="text-amber-500">CMS</span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">Selamat Datang</h1>
            <p className="text-zinc-500">
              Masukkan kredensial Anda untuk mengakses dashboard.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {state.error}
              </div>
            )}

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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="password">Password</label>
                <Link href="#" className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                  Lupa Password?
                </Link>
              </div>
              <input 
                type="password" 
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-[#09090b] hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Memproses...
                </>
              ) : "Masuk"}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-zinc-500">
            Belum mendaftarkan gereja Anda?{" "}
            <Link href="/register" className="font-semibold text-zinc-900 hover:text-purple-600 transition-colors">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
