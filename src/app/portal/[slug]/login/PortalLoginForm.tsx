"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

interface PortalLoginFormProps {
  slug: string;
  initialEmail?: string;
}

export default function PortalLoginForm({ slug, initialEmail = "" }: PortalLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const hasInitialEmail = initialEmail.trim().length > 0;

  return (
    <form className="space-y-6" action={formAction}>
      {/* Hidden Input for slug */}
      <input type="hidden" name="slug" value={slug} />

      {state?.error && (
        <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 text-brand-gold text-xs rounded-lg font-semibold leading-relaxed">
          ⚠️ {state.error}
        </div>
      )}

      {hasInitialEmail ? (
        /* Pre-filled Email Display */
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Alamat Email
          </label>
          <div className="bg-zinc-800/40 border border-white/5 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{initialEmail}</span>
            <span className="text-[10px] text-zinc-500 font-extrabold tracking-wider uppercase border border-zinc-700/50 px-2 py-0.5 rounded">
              Diverifikasi
            </span>
          </div>
          {/* Hidden field so email is submitted with the form data */}
          <input type="hidden" name="email" value={initialEmail} />
        </div>
      ) : (
        /* Standard Email Input if accessed directly */
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Alamat Email
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all placeholder-zinc-600"
              placeholder="admin@gereja.com"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Password Akun
        </label>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus={hasInitialEmail}
            className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all placeholder-zinc-600 font-sans"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="pt-2">
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
              Memproses...
            </>
          ) : (
            "Masuk Ke Dashboard →"
          )}
        </button>
      </div>
    </form>
  );
}
