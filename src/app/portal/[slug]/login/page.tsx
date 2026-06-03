import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PortalLoginForm from "./PortalLoginForm";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function PortalLoginPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { email } = await searchParams;
  
  const church = await prisma.church.findUnique({
    where: { slug }
  });

  if (!church) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-orange/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-orange to-brand-gold rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/20 transform -rotate-6 select-none">
            <span className="text-zinc-950 font-black text-3xl tracking-tighter block transform rotate-6">
              {church.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Portal {church.name}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400 font-medium">
          Masuk ke Dashboard Manajemen Gereja
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-zinc-900/80 backdrop-blur-md py-8 px-6 border border-white/10 shadow-2xl rounded-2xl sm:px-10">
          <PortalLoginForm slug={slug} initialEmail={email || ""} />
        </div>
        
        <p className="mt-8 text-center text-xs text-zinc-600 font-medium tracking-wide uppercase select-none">
          Diberdayakan oleh Yesh CMS
        </p>
      </div>
    </div>
  );
}
