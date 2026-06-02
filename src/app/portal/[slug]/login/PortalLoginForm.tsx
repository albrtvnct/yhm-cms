"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function PortalLoginForm({ slug }: { slug: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form className="space-y-6" action={formAction}>
      {/* Hidden Input for slug */}
      <input type="hidden" name="slug" value={slug} />

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-zinc-700">
          Alamat Email
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none block w-full px-4 py-3 border border-zinc-200 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium sm:text-sm"
            placeholder="admin@gereja.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-zinc-700">
          Password
        </label>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-4 py-3 border border-zinc-200 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium sm:text-sm"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Memproses..." : "Masuk"}
        </button>
      </div>
    </form>
  );
}
